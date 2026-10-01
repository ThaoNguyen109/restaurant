package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.entity.*;
import com.restaurant.restaurant_management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final MenuItemRepository menuItemRepository;
    private final ComboRepository comboRepository;
    private final WebSocketEventService wsEventService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RestaurantTableRepository restaurantTableRepository,
            MenuItemRepository menuItemRepository,
            ComboRepository comboRepository,
            WebSocketEventService wsEventService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.menuItemRepository = menuItemRepository;
        this.comboRepository = comboRepository;
        this.wsEventService = wsEventService;
    }

    // ── Mapper Helpers ─────────────────────────────────────────────

    public OrderItemResponse toItemResponse(OrderItem item) {
        OrderItemResponse.OrderItemResponseBuilder builder = OrderItemResponse.builder()
                .id(item.getId())
                .orderId(item.getOrder() != null ? item.getOrder().getId() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .status(item.getStatus())
                .note(item.getNote());

        if (item.getMenuItem() != null) {
            MenuItem m = item.getMenuItem();
            builder.menuItemId(m.getId())
                    .menuItemName(m.getName())
                    .menuItemImage(m.getImage())
                    .itemName(m.getName())
                    .itemType("MENU_ITEM")
                    .image(m.getImage());
        } else if (item.getCombo() != null) {
            Combo c = item.getCombo();
            builder.comboId(c.getId())
                    .comboName(c.getName())
                    .comboImage(c.getImage())
                    .itemName(c.getName())
                    .itemType("COMBO")
                    .image(c.getImage());
        }

        return builder.build();
    }

    public OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getOrderItems() != null
                ? order.getOrderItems().stream().map(this::toItemResponse).collect(Collectors.toList())
                : new ArrayList<>();

        int totalCount = itemResponses.stream()
                .filter(i -> !"CANCELLED".equalsIgnoreCase(i.getStatus()))
                .mapToInt(OrderItemResponse::getQuantity)
                .sum();

        OrderResponse.OrderResponseBuilder builder = OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .totalItemCount(totalCount);

        if (order.getTable() != null) {
            builder.tableId(order.getTable().getId())
                    .tableNumber(order.getTable().getTableNumber())
                    .tableCapacity(order.getTable().getCapacity());
        }

        return builder.build();
    }

    private RestaurantTableResponse toTableResponse(RestaurantTable table) {
        if (table == null) return null;
        return new RestaurantTableResponse(
                table.getId(),
                table.getTableNumber(),
                table.getCapacity(),
                table.getStatus(),
                table.getCreatedAt(),
                table.getUpdatedAt()
        );
    }

    // ── Business Methods ──────────────────────────────────────────

    /**
     * Lấy danh sách đơn hàng có bộ lọc (status, date yyyy-MM-dd, search, tableId)
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(String status, String date, String search, Long tableId) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (date != null && !date.isBlank()) {
            LocalDate localDate = LocalDate.parse(date.trim());
            startDate = localDate.atStartOfDay();
            endDate = localDate.atTime(LocalTime.MAX);
        }

        String keyword = (search != null && !search.isBlank()) ? search.trim() : null;
        String filterStatus = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;

        List<Order> orders = orderRepository.filterOrders(filterStatus, tableId, startDate, endDate, keyword);
        return orders.stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết đơn hàng
     */
    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));
        return toOrderResponse(order);
    }

    /**
     * Tạo đơn hàng mới
     */
    public OrderResponse createOrder(CreateOrderRequest request) {
        RestaurantTable table = restaurantTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với ID: " + request.getTableId()));

        Order order = new Order();
        order.setTable(table);
        order.setStatus("PENDING");
        order.setNote(request.getNote());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setTotalAmount(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderItemRequest itemReq : request.getItems()) {
                OrderItem item = buildOrderItemFromRequest(itemReq);
                order.addOrderItem(item);
                total = total.add(item.getSubtotal());
            }
        }

        order.setTotalAmount(total);

        // Khi mở đơn mới, chuyển bàn sang OCCUPIED (Đang có khách)
        table.setStatus("OCCUPIED");
        restaurantTableRepository.save(table);

        Order saved = orderRepository.save(order);
        OrderResponse resp = toOrderResponse(saved);

        wsEventService.sendKitchenEvent("ORDER_CREATED", "Bàn " + table.getTableNumber() + " vừa gọi món mới", resp);
        wsEventService.sendOrderEvent("ORDER_CREATED", "Bàn " + table.getTableNumber() + " vừa mở đơn", resp);
        wsEventService.sendTableEvent("TABLE_UPDATED", "Bàn " + table.getTableNumber() + " chuyển sang Có khách", toTableResponse(table));

        return resp;
    }

    /**
     * Cập nhật thông tin đơn hàng (bàn, ghi chú)
     */
    public OrderResponse updateOrder(Long id, UpdateOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));

        if (request.getTableId() != null && !request.getTableId().equals(order.getTable().getId())) {
            RestaurantTable newTable = restaurantTableRepository.findById(request.getTableId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với ID: " + request.getTableId()));
            newTable.setStatus("OCCUPIED");
            restaurantTableRepository.save(newTable);
            order.setTable(newTable);
        }

        if (request.getNote() != null) {
            order.setNote(request.getNote());
        }

        order.setUpdatedAt(LocalDateTime.now());
        return toOrderResponse(orderRepository.save(order));
    }

    /**
     * Cập nhật trạng thái đơn hàng (PENDING -> CONFIRMED -> PREPARING -> SERVING -> COMPLETED / CANCELLED)
     */
    public OrderResponse updateOrderStatus(Long id, OrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));

        String newStatus = request.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        // Nếu trạng thái là CANCELLED -> huỷ tất cả món chưa phục vụ
        if ("CANCELLED".equalsIgnoreCase(newStatus)) {
            for (OrderItem item : order.getOrderItems()) {
                if (!"SERVED".equalsIgnoreCase(item.getStatus())) {
                    item.setStatus("CANCELLED");
                }
            }
            recalculateTotal(order);
        }

        // Nếu trạng thái là COMPLETED -> đánh dấu tất cả món là SERVED (nếu chưa huỷ)
        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            for (OrderItem item : order.getOrderItems()) {
                if (!"CANCELLED".equalsIgnoreCase(item.getStatus())) {
                    item.setStatus("SERVED");
                }
            }
        }

        // Kiểm tra giải phóng bàn nếu đơn COMPLETED hoặc CANCELLED
        if (List.of("COMPLETED", "CANCELLED").contains(newStatus) && order.getTable() != null) {
            Long tableId = order.getTable().getId();
            List<Order> otherActiveOrders = orderRepository.findActiveOrdersByTableId(tableId)
                    .stream()
                    .filter(o -> !o.getId().equals(order.getId()))
                    .collect(Collectors.toList());

            if (otherActiveOrders.isEmpty()) {
                RestaurantTable table = order.getTable();
                table.setStatus("AVAILABLE");
                restaurantTableRepository.save(table);
            }
        } else if (List.of("CONFIRMED", "PREPARING", "SERVING", "PENDING").contains(newStatus) && order.getTable() != null) {
            RestaurantTable table = order.getTable();
            table.setStatus("OCCUPIED");
            restaurantTableRepository.save(table);
        }

        Order saved = orderRepository.save(order);
        OrderResponse resp = toOrderResponse(saved);

        String msg = "Đơn #" + order.getId() + " đổi trạng thái sang " + newStatus;
        wsEventService.sendKitchenEvent("ORDER_STATUS_CHANGED", msg, resp);
        wsEventService.sendOrderEvent("ORDER_STATUS_CHANGED", msg, resp);
        if (order.getTable() != null) {
            wsEventService.sendTableEvent("TABLE_UPDATED", "Bàn " + order.getTable().getTableNumber() + " trạng thái: " + order.getTable().getStatus(), toTableResponse(order.getTable()));
        }

        return resp;
    }

    /**
     * Xóa đơn hàng
     */
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));

        Long tableId = order.getTable() != null ? order.getTable().getId() : null;
        orderRepository.delete(order);

        if (tableId != null) {
            List<Order> otherActive = orderRepository.findActiveOrdersByTableId(tableId);
            if (otherActive.isEmpty()) {
                restaurantTableRepository.findById(tableId).ifPresent(t -> {
                    t.setStatus("AVAILABLE");
                    restaurantTableRepository.save(t);
                });
            }
        }
    }

    /**
     * Thêm món vào đơn hàng hiện có (gọi thêm món)
     */
    public OrderResponse addOrderItem(Long orderId, OrderItemRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (List.of("COMPLETED", "CANCELLED").contains(order.getStatus())) {
            throw new RuntimeException("Không thể thêm món vào đơn hàng đã " +
                    ("COMPLETED".equals(order.getStatus()) ? "hoàn tất" : "bị huỷ"));
        }

        OrderItem newItem = buildOrderItemFromRequest(request);
        order.addOrderItem(newItem);
        recalculateTotal(order);
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        OrderResponse resp = toOrderResponse(saved);

        String tableNum = order.getTable() != null ? String.valueOf(order.getTable().getTableNumber()) : "";
        wsEventService.sendKitchenEvent("ITEM_ADDED", "Bàn " + tableNum + " vừa gọi thêm món mới", resp);
        wsEventService.sendOrderEvent("ITEM_ADDED", "Bàn " + tableNum + " gọi thêm món", resp);

        return resp;
    }

    /**
     * Cập nhật số lượng / ghi chú của một món trong đơn
     */
    public OrderResponse updateOrderItem(Long orderId, Long itemId, UpdateOrderItemRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        OrderItem item = order.getOrderItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món với ID: " + itemId + " trong đơn hàng"));

        if (request.getQuantity() != null && request.getQuantity() > 0) {
            item.setQuantity(request.getQuantity());
            item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        if (request.getNote() != null) {
            item.setNote(request.getNote());
        }

        recalculateTotal(order);
        order.setUpdatedAt(LocalDateTime.now());
        return toOrderResponse(orderRepository.save(order));
    }

    /**
     * Cập nhật trạng thái chế biến của từng món (PENDING -> COOKING -> SERVED -> CANCELLED)
     */
    public OrderResponse updateOrderItemStatus(Long orderId, Long itemId, OrderItemStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        OrderItem item = order.getOrderItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món với ID: " + itemId + " trong đơn hàng"));

        item.setStatus(request.getStatus());
        recalculateTotal(order);
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        OrderResponse resp = toOrderResponse(saved);

        String itemName = item.getMenuItem() != null ? item.getMenuItem().getName() : (item.getCombo() != null ? item.getCombo().getName() : "Món");
        String tableNum = order.getTable() != null ? " Bàn " + order.getTable().getTableNumber() : "";
        String msg = "Món " + itemName + tableNum + " -> " + request.getStatus();

        wsEventService.sendKitchenEvent("ITEM_STATUS_CHANGED", msg, resp);
        wsEventService.sendOrderEvent("ITEM_STATUS_CHANGED", msg, resp);

        return resp;
    }

    /**
     * Xóa một món khỏi đơn hàng
     */
    public OrderResponse deleteOrderItem(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        OrderItem item = order.getOrderItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món với ID: " + itemId + " trong đơn hàng"));

        order.removeOrderItem(item);
        recalculateTotal(order);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        OrderResponse resp = toOrderResponse(saved);

        wsEventService.sendKitchenEvent("ITEM_DELETED", "Một món trong đơn #" + order.getId() + " đã bị hủy", resp);
        wsEventService.sendOrderEvent("ITEM_DELETED", "Hủy món khỏi đơn #" + order.getId(), resp);

        return resp;
    }

    /**
     * Lấy các đơn hàng đang hoạt động của một bàn
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrdersByTable(Long tableId) {
        return orderRepository.findActiveOrdersByTableId(tableId)
                .stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * Thống kê tổng quan đơn hàng hôm nay
     */
    @Transactional(readOnly = true)
    public OrderStatsResponse getOrderStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        long totalToday = orderRepository.countOrdersBetween(startOfDay, endOfDay);
        long pending = orderRepository.countByStatus("PENDING");
        long preparing = orderRepository.countByStatus("PREPARING");
        long serving = orderRepository.countByStatus("SERVING");
        long completedToday = orderRepository.countByStatusAndCreatedAtBetween("COMPLETED", startOfDay, endOfDay);
        BigDecimal revenueToday = orderRepository.sumRevenueBetween(startOfDay, endOfDay);

        return OrderStatsResponse.builder()
                .totalOrdersToday(totalToday)
                .pendingOrders(pending)
                .preparingOrders(preparing)
                .servingOrders(serving)
                .completedOrdersToday(completedToday)
                .revenueToday(revenueToday != null ? revenueToday : BigDecimal.ZERO)
                .build();
    }

    // ── Helper Logic ──────────────────────────────────────────────

    private OrderItem buildOrderItemFromRequest(OrderItemRequest itemReq) {
        if (itemReq.getMenuItemId() == null && itemReq.getComboId() == null) {
            throw new RuntimeException("Món ăn phải chọn MenuItem hoặc Combo");
        }
        if (itemReq.getMenuItemId() != null && itemReq.getComboId() != null) {
            throw new RuntimeException("Chỉ được chọn MenuItem hoặc Combo cho mỗi mục, không được chọn cả hai");
        }

        OrderItem item = new OrderItem();
        item.setQuantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : 1);
        item.setStatus("PENDING");
        item.setNote(itemReq.getNote());

        if (itemReq.getMenuItemId() != null) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn với ID: " + itemReq.getMenuItemId()));
            item.setMenuItem(menuItem);
            item.setUnitPrice(menuItem.getPrice());
        } else {
            Combo combo = comboRepository.findById(itemReq.getComboId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy combo với ID: " + itemReq.getComboId()));
            item.setCombo(combo);
            item.setUnitPrice(combo.getPrice());
        }

        item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        return item;
    }

    private void recalculateTotal(Order order) {
        BigDecimal total = BigDecimal.ZERO;
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (!"CANCELLED".equalsIgnoreCase(item.getStatus())) {
                    total = total.add(item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO);
                }
            }
        }
        order.setTotalAmount(total);
    }
}
