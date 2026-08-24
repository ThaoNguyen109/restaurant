package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.RestaurantTableRequest;
import com.restaurant.restaurant_management.entity.RestaurantTable;
import com.restaurant.restaurant_management.service.RestaurantTableService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
public class RestaurantTableController {

    private final RestaurantTableService restaurantTableService;

    public RestaurantTableController(RestaurantTableService restaurantTableService) {
        this.restaurantTableService = restaurantTableService;
    }

    // Lấy tất cả bàn đang hoạt động
    @GetMapping
    public ResponseEntity<List<RestaurantTable>> getAllTables() {
        return ResponseEntity.ok(
                restaurantTableService.getActiveTables()
        );
    }

    // Lấy bàn theo ID
    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTable> getTableById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                restaurantTableService.getTableById(id)
        );
    }

    // Thêm bàn
    @PostMapping
    public ResponseEntity<RestaurantTable> createTable(
            @Valid @RequestBody RestaurantTableRequest request
    ) {
        return ResponseEntity.ok(
                restaurantTableService.createTable(request)
        );
    }

    // Cập nhật bàn
    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTable> updateTable(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantTableRequest request
    ) {
        return ResponseEntity.ok(
                restaurantTableService.updateTable(id, request)
        );
    }

    // Xóa mềm
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTable(
            @PathVariable Long id
    ) {
        restaurantTableService.deleteTable(id);

        return ResponseEntity.ok("Xóa bàn thành công");
    }
}