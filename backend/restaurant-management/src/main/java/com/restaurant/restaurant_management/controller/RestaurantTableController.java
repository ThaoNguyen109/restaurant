package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.RestaurantTableRequest;
import com.restaurant.restaurant_management.dto.RestaurantTableResponse;
import com.restaurant.restaurant_management.dto.TableStatusRequest;
import com.restaurant.restaurant_management.service.RestaurantTableService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tables")
public class RestaurantTableController {

    private final RestaurantTableService restaurantTableService;

    public RestaurantTableController(RestaurantTableService restaurantTableService) {
        this.restaurantTableService = restaurantTableService;
    }

    /**
     * GET /api/tables
     * Lấy tất cả bàn đang hoạt động (loại trừ INACTIVE) – dành cho nhân viên/khách
     * Query param: status (tuỳ chọn – lọc theo trạng thái cụ thể)
     */
    @GetMapping
    public ResponseEntity<List<RestaurantTableResponse>> getTables(
            @RequestParam(required = false) String status
    ) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(restaurantTableService.getTablesByStatus(status));
        }
        return ResponseEntity.ok(restaurantTableService.getActiveTables());
    }

    /**
     * GET /api/tables/all
     * Lấy toàn bộ bàn (bao gồm INACTIVE) – dành cho admin
     */
    @GetMapping("/all")
    public ResponseEntity<List<RestaurantTableResponse>> getAllTables() {
        return ResponseEntity.ok(restaurantTableService.getAllTables());
    }

    /**
     * GET /api/tables/{id}
     * Lấy chi tiết bàn theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTableResponse> getTableById(@PathVariable Long id) {
        // Reuse service.getTableById rồi wrap vào DTO
        var entity = restaurantTableService.getTableById(id);
        RestaurantTableResponse resp = new RestaurantTableResponse(
                entity.getId(), entity.getTableNumber(), entity.getCapacity(),
                entity.getStatus(), entity.getCreatedAt(), entity.getUpdatedAt()
        );
        return ResponseEntity.ok(resp);
    }

    /**
     * POST /api/tables
     * Thêm bàn mới
     */
    @PostMapping
    public ResponseEntity<RestaurantTableResponse> createTable(
            @Valid @RequestBody RestaurantTableRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(restaurantTableService.createTable(request));
    }

    /**
     * PUT /api/tables/{id}
     * Cập nhật thông tin bàn (số bàn, sức chứa, trạng thái)
     */
    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTableResponse> updateTable(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantTableRequest request
    ) {
        return ResponseEntity.ok(restaurantTableService.updateTable(id, request));
    }

    /**
     * PATCH /api/tables/{id}/status
     * Cập nhật nhanh trạng thái bàn
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<RestaurantTableResponse> updateTableStatus(
            @PathVariable Long id,
            @Valid @RequestBody TableStatusRequest request
    ) {
        return ResponseEntity.ok(restaurantTableService.updateTableStatus(id, request));
    }

    /**
     * DELETE /api/tables/{id}
     * Xóa mềm bàn (đặt trạng thái INACTIVE)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTable(@PathVariable Long id) {
        restaurantTableService.deleteTable(id);
        return ResponseEntity.ok(Map.of("message", "Xóa bàn thành công"));
    }
}