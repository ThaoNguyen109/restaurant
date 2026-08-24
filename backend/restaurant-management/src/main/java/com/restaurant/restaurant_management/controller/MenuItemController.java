package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.MenuItemRequest;
import com.restaurant.restaurant_management.dto.MenuItemResponse;
import com.restaurant.restaurant_management.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    // 1. Lấy danh sách món ăn (hỗ trợ lọc categoryId, search tên/mô tả, lọc status)
    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> getAllMenuItems(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        return ResponseEntity.ok(menuItemService.getAllMenuItems(categoryId, search, status));
    }

    // 2. Lấy chi tiết một món ăn theo ID
    @GetMapping("/{id}")
    public ResponseEntity<MenuItemResponse> getMenuItemById(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.getMenuItemById(id));
    }

    // 3. Thêm món ăn mới kèm chọn tải lên file hình ảnh (Multipart Form Data)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> createMenuItem(
            @ModelAttribute @Valid MenuItemRequest request) {

        MenuItemResponse response = menuItemService.createMenuItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 4. Cập nhật món ăn (có thể đổi ảnh mới hoặc cập nhật thông tin)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> updateMenuItem(
            @PathVariable Long id,
            @ModelAttribute @Valid MenuItemRequest request) {

        MenuItemResponse response = menuItemService.updateMenuItem(id, request);
        return ResponseEntity.ok(response);
    }

    // 5. Cập nhật trạng thái món ăn (ACTIVE, INACTIVE, OUT_OF_STOCK)
    @PatchMapping("/{id}/status")
    public ResponseEntity<MenuItemResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusBody) {

        String status = statusBody.get("status");
        if (status == null || status.isBlank()) {
            throw new RuntimeException("Trạng thái không được để trống");
        }

        MenuItemResponse response = menuItemService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    // 6. Xóa món ăn và file ảnh liên quan
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuItemService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }
}
