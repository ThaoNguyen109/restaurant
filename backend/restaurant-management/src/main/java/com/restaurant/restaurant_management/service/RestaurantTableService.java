package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.RestaurantTableRequest;
import com.restaurant.restaurant_management.dto.RestaurantTableResponse;
import com.restaurant.restaurant_management.dto.TableStatusRequest;
import com.restaurant.restaurant_management.entity.RestaurantTable;
import com.restaurant.restaurant_management.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;
    private final WebSocketEventService wsEventService;

    public RestaurantTableService(RestaurantTableRepository restaurantTableRepository, WebSocketEventService wsEventService) {
        this.restaurantTableRepository = restaurantTableRepository;
        this.wsEventService = wsEventService;
    }

    // ── Mapper helper ──────────────────────────────────────────────────────────
    private RestaurantTableResponse toResponse(RestaurantTable table) {
        return new RestaurantTableResponse(
                table.getId(),
                table.getTableNumber(),
                table.getCapacity(),
                table.getStatus(),
                table.getCreatedAt(),
                table.getUpdatedAt()
        );
    }

    // ── Lấy tất cả bàn (kể cả INACTIVE) – dùng cho admin ─────────────────────
    public List<RestaurantTableResponse> getAllTables() {
        return restaurantTableRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Lấy các bàn đang hoạt động (không bao gồm INACTIVE) ──────────────────
    public List<RestaurantTableResponse> getActiveTables() {
        return restaurantTableRepository.findByStatusNot("INACTIVE")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Lấy bàn theo trạng thái ───────────────────────────────────────────────
    public List<RestaurantTableResponse> getTablesByStatus(String status) {
        return restaurantTableRepository.findByStatus(status)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Lấy bàn theo ID ───────────────────────────────────────────────────────
    public RestaurantTable getTableById(Long id) {
        return restaurantTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với ID: " + id));
    }

    // ── Thêm bàn mới ──────────────────────────────────────────────────────────
    public RestaurantTableResponse createTable(RestaurantTableRequest request) {
        if (restaurantTableRepository.existsByTableNumber(request.getTableNumber())) {
            throw new RuntimeException("Bàn số " + request.getTableNumber() + " đã tồn tại");
        }

        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(request.getTableNumber());
        table.setCapacity(request.getCapacity());
        table.setStatus(
                (request.getStatus() == null || request.getStatus().isBlank())
                        ? "AVAILABLE"
                        : request.getStatus()
        );
        table.setCreatedAt(LocalDateTime.now());
        table.setUpdatedAt(LocalDateTime.now());

        return toResponse(restaurantTableRepository.save(table));
    }

    // ── Cập nhật thông tin bàn ────────────────────────────────────────────────
    public RestaurantTableResponse updateTable(Long id, RestaurantTableRequest request) {
        RestaurantTable table = getTableById(id);

        if (!table.getTableNumber().equals(request.getTableNumber())
                && restaurantTableRepository.existsByTableNumber(request.getTableNumber())) {
            throw new RuntimeException("Bàn số " + request.getTableNumber() + " đã tồn tại");
        }

        table.setTableNumber(request.getTableNumber());
        table.setCapacity(request.getCapacity());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            table.setStatus(request.getStatus());
        }
        table.setUpdatedAt(LocalDateTime.now());

        RestaurantTableResponse resp = toResponse(restaurantTableRepository.save(table));
        wsEventService.sendTableEvent("TABLE_UPDATED", "Cập nhật Bàn " + resp.getTableNumber(), resp);
        return resp;
    }

    // ── Cập nhật nhanh trạng thái bàn ────────────────────────────────────────
    public RestaurantTableResponse updateTableStatus(Long id, TableStatusRequest request) {
        RestaurantTable table = getTableById(id);
        table.setStatus(request.getStatus());
        table.setUpdatedAt(LocalDateTime.now());
        RestaurantTableResponse resp = toResponse(restaurantTableRepository.save(table));
        wsEventService.sendTableEvent("TABLE_STATUS_CHANGED", "Bàn " + resp.getTableNumber() + " đổi sang " + resp.getStatus(), resp);
        return resp;
    }

    // ── Xóa mềm (đặt INACTIVE) ───────────────────────────────────────────────
    public void deleteTable(Long id) {
        RestaurantTable table = getTableById(id);
        table.setStatus("INACTIVE");
        table.setUpdatedAt(LocalDateTime.now());
        RestaurantTable saved = restaurantTableRepository.save(table);
        wsEventService.sendTableEvent("TABLE_DELETED", "Bàn " + saved.getTableNumber() + " đã ngưng hoạt động", toResponse(saved));
    }
}