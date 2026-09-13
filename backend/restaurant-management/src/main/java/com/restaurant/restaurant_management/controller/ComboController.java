package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.ComboItemRequest;
import com.restaurant.restaurant_management.dto.ComboItemResponse;
import com.restaurant.restaurant_management.dto.ComboRequest;
import com.restaurant.restaurant_management.dto.ComboResponse;
import com.restaurant.restaurant_management.service.ComboService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/combos")
public class ComboController {

    private final ComboService comboService;

    public ComboController(ComboService comboService) {
        this.comboService = comboService;
    }

    // Lấy danh sách combo
    @GetMapping
    public ResponseEntity<List<ComboResponse>> getAllCombos() {
        return ResponseEntity.ok(comboService.getAllCombos());
    }

    // Lấy combo theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ComboResponse> getComboById(@PathVariable Long id) {
        return ResponseEntity.ok(comboService.getComboById(id));
    }

    // Thêm combo
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ComboResponse> createCombo(
            @ModelAttribute ComboRequest request) {

        return ResponseEntity.ok(comboService.createCombo(request));
    }

    // Cập nhật combo
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<ComboResponse> updateCombo(
            @PathVariable Long id,
            @ModelAttribute ComboRequest request) {

        return ResponseEntity.ok(
                comboService.updateCombo(id, request)
        );
    }

    // Xóa mềm combo
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCombo(@PathVariable Long id) {

        comboService.deleteCombo(id);

        return ResponseEntity.noContent().build();
    }

    // --- API QUẢN LÝ COMBO ITEMS ---

    // Lấy danh sách món trong combo
    @GetMapping("/{comboId}/items")
    public ResponseEntity<List<ComboItemResponse>> getComboItems(@PathVariable Long comboId) {
        return ResponseEntity.ok(comboService.getComboItems(comboId));
    }

    // Thêm một món vào combo
    @PostMapping("/{comboId}/items")
    public ResponseEntity<ComboItemResponse> addComboItem(
            @PathVariable Long comboId,
            @RequestBody ComboItemRequest request) {
        return ResponseEntity.ok(comboService.addComboItem(comboId, request));
    }

    // Cập nhật số lượng của một món trong combo
    @PutMapping("/{comboId}/items/{menuItemId}")
    public ResponseEntity<ComboItemResponse> updateComboItemQuantity(
            @PathVariable Long comboId,
            @PathVariable Long menuItemId,
            @RequestBody ComboItemRequest request) {
        return ResponseEntity.ok(comboService.updateComboItemQuantity(comboId, menuItemId, request.getQuantity()));
    }

    // Xóa một món khỏi combo
    @DeleteMapping("/{comboId}/items/{menuItemId}")
    public ResponseEntity<Void> removeComboItem(
            @PathVariable Long comboId,
            @PathVariable Long menuItemId) {
        comboService.removeComboItem(comboId, menuItemId);
        return ResponseEntity.noContent().build();
    }

    // Thay thế toàn bộ danh sách món trong combo
    @PutMapping("/{comboId}/items")
    public ResponseEntity<List<ComboItemResponse>> setComboItems(
            @PathVariable Long comboId,
            @RequestBody List<ComboItemRequest> items) {
        return ResponseEntity.ok(comboService.setComboItems(comboId, items));
    }
}