package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * POST /api/orders
     * Tạo đơn hàng mới
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    /**
     * GET /api/orders
     * Lấy danh sách đơn hàng (hỗ trợ lọc theo status, date, search, tableId)
     */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long tableId
    ) {
        return ResponseEntity.ok(orderService.getAllOrders(status, date, search, tableId));
    }

    /**
     * GET /api/orders/{id}
     * Lấy chi tiết đơn hàng
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    /**
     * PUT /api/orders/{id}
     * Cập nhật thông tin đơn hàng (bàn, ghi chú)
     */
    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    /**
     * PATCH /api/orders/{id}/status
     * Cập nhật trạng thái đơn hàng (PENDING, CONFIRMED, PREPARING, SERVING, COMPLETED, CANCELLED)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request));
    }

    /**
     * DELETE /api/orders/{id}
     * Xóa đơn hàng
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(Map.of("message", "Xóa đơn hàng thành công"));
    }

    /**
     * GET /api/orders/stats/summary
     * Thống kê tổng quan đơn hàng hôm nay
     */
    @GetMapping("/stats/summary")
    public ResponseEntity<OrderStatsResponse> getOrderStats() {
        return ResponseEntity.ok(orderService.getOrderStats());
    }

    /**
     * GET /api/orders/active-by-table/{tableId}
     * Lấy đơn hàng đang hoạt động của một bàn
     */
    @GetMapping("/active-by-table/{tableId}")
    public ResponseEntity<List<OrderResponse>> getActiveOrdersByTable(@PathVariable Long tableId) {
        return ResponseEntity.ok(orderService.getActiveOrdersByTable(tableId));
    }

    // ── Order Items APIs ──────────────────────────────────────────

    /**
     * POST /api/orders/{id}/items
     * Thêm món vào đơn hàng hiện có
     */
    @PostMapping("/{id}/items")
    public ResponseEntity<OrderResponse> addOrderItem(
            @PathVariable Long id,
            @Valid @RequestBody OrderItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.addOrderItem(id, request));
    }

    /**
     * PUT /api/orders/{id}/items/{itemId}
     * Cập nhật số lượng / ghi chú của một món trong đơn
     */
    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<OrderResponse> updateOrderItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateOrderItemRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderItem(id, itemId, request));
    }

    /**
     * PATCH /api/orders/{id}/items/{itemId}/status
     * Cập nhật trạng thái của một món trong đơn (PENDING, COOKING, SERVED, CANCELLED)
     */
    @PatchMapping("/{id}/items/{itemId}/status")
    public ResponseEntity<OrderResponse> updateOrderItemStatus(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody OrderItemStatusRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderItemStatus(id, itemId, request));
    }

    /**
     * DELETE /api/orders/{id}/items/{itemId}
     * Xóa món khỏi đơn hàng
     */
    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<OrderResponse> deleteOrderItem(
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(orderService.deleteOrderItem(id, itemId));
    }
}
