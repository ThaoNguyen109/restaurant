package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    /**
     * GET /api/promotions
     * Lấy danh sách khuyến mãi đang có hiệu lực (Public cho khách hàng và thu ngân)
     */
    @GetMapping
    public ResponseEntity<List<PromotionResponse>> getActivePromotions() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    /**
     * GET /api/promotions/all
     * Lấy toàn bộ danh sách khuyến mãi (Dành cho Quản lý / Admin)
     */
    @GetMapping("/all")
    public ResponseEntity<List<PromotionResponse>> getAllPromotions() {
        return ResponseEntity.ok(promotionService.getAllPromotions());
    }

    /**
     * GET /api/promotions/{id}
     * Chi tiết chương trình khuyến mãi theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponse> getPromotionById(@PathVariable Long id) {
        return ResponseEntity.ok(promotionService.getPromotionById(id));
    }

    /**
     * POST /api/promotions/calculate
     * Tính toán giảm giá theo Strategy Pattern cho đơn hàng
     * Public để cả khách hàng và thu ngân đều gọi được trước khi chốt đơn
     */
    @PostMapping("/calculate")
    public ResponseEntity<PromotionCalculationResponse> calculateDiscount(
            @Valid @RequestBody PromotionCalculationRequest request
    ) {
        return ResponseEntity.ok(promotionService.calculatePromotion(request));
    }

    /**
     * POST /api/promotions/order/{orderId}/apply
     * Áp dụng mã khuyến mãi vào đơn hàng
     */
    @PostMapping("/order/{orderId}/apply")
    public ResponseEntity<OrderResponse> applyToOrder(
            @PathVariable Long orderId,
            @RequestParam String code
    ) {
        return ResponseEntity.ok(promotionService.applyPromotionToOrder(orderId, code));
    }

    /**
     * POST /api/promotions
     * Tạo mới chương trình khuyến mãi (ADMIN / MANAGER)
     */
    @PostMapping
    public ResponseEntity<PromotionResponse> createPromotion(
            @Valid @RequestBody PromotionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.createPromotion(request));
    }

    /**
     * PUT /api/promotions/{id}
     * Cập nhật chương trình khuyến mãi (ADMIN / MANAGER)
     */
    @PutMapping("/{id}")
    public ResponseEntity<PromotionResponse> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequest request
    ) {
        return ResponseEntity.ok(promotionService.updatePromotion(id, request));
    }

    /**
     * DELETE /api/promotions/{id}
     * Xóa chương trình khuyến mãi (ADMIN / MANAGER)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/promotions/{id}/toggle-status
     * Bật / Tắt trạng thái khuyến mãi (ACTIVE <-> INACTIVE)
     */
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<PromotionResponse> togglePromotionStatus(@PathVariable Long id) {
        return ResponseEntity.ok(promotionService.togglePromotionStatus(id));
    }
}
