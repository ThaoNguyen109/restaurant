package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.entity.Order;
import com.restaurant.restaurant_management.entity.Promotion;
import com.restaurant.restaurant_management.repository.OrderRepository;
import com.restaurant.restaurant_management.repository.PromotionRepository;
import com.restaurant.restaurant_management.strategy.discount.DiscountStrategy;
import com.restaurant.restaurant_management.strategy.discount.PromotionStrategyFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final OrderRepository orderRepository;
    private final PromotionStrategyFactory strategyFactory;

    // ── 1. Lấy danh sách khuyến mãi ────────────────────────────────────

    public List<PromotionResponse> getAllPromotions() {
        return promotionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PromotionResponse> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findActivePromotions(now)
                .stream()
                .filter(p -> p.getUsageLimit() == null || p.getUsedCount() < p.getUsageLimit())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PromotionResponse getPromotionById(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chương trình khuyến mãi với ID: " + id));
        return toResponse(promotion);
    }

    public PromotionResponse getPromotionByCode(String code) {
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new RuntimeException("Mã khuyến mãi không tồn tại: " + code));
        return toResponse(promotion);
    }

    // ── 2. Tạo, Cập nhật, Xóa khuyến mãi ─────────────────────────────

    public PromotionResponse createPromotion(PromotionRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (promotionRepository.existsByCodeIgnoreCase(code)) {
            throw new RuntimeException("Mã khuyến mãi '" + code + "' đã tồn tại!");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu khuyến mãi.");
        }

        Promotion promotion = Promotion.builder()
                .code(code)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .type(request.getType())
                .discountValue(request.getDiscountValue())
                .maxDiscount(request.getMaxDiscount())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .status(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus() : "ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(promotionRepository.save(promotion));
    }

    public PromotionResponse updatePromotion(Long id, PromotionRequest request) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khuyến mãi với ID: " + id));

        String newCode = request.getCode().trim().toUpperCase();
        if (!promotion.getCode().equalsIgnoreCase(newCode) && promotionRepository.existsByCodeIgnoreCase(newCode)) {
            throw new RuntimeException("Mã khuyến mãi '" + newCode + "' đã tồn tại!");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu khuyến mãi.");
        }

        promotion.setCode(newCode);
        promotion.setTitle(request.getTitle().trim());
        promotion.setDescription(request.getDescription());
        promotion.setType(request.getType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setMaxDiscount(request.getMaxDiscount());
        promotion.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setUsageLimit(request.getUsageLimit());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            promotion.setStatus(request.getStatus());
        }
        promotion.setUpdatedAt(LocalDateTime.now());

        return toResponse(promotionRepository.save(promotion));
    }

    public void deletePromotion(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khuyến mãi với ID: " + id);
        }
        promotionRepository.deleteById(id);
    }

    public PromotionResponse togglePromotionStatus(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khuyến mãi với ID: " + id));
        String newStatus = "ACTIVE".equalsIgnoreCase(promotion.getStatus()) ? "INACTIVE" : "ACTIVE";
        promotion.setStatus(newStatus);
        promotion.setUpdatedAt(LocalDateTime.now());
        return toResponse(promotionRepository.save(promotion));
    }

    // ── 3. Strategy Pattern: Tính giá khuyến mãi ────────────────────────

    /**
     * Áp dụng Strategy Pattern để tính số tiền giảm giá và giá cuối cùng
     */
    public PromotionCalculationResponse calculatePromotion(PromotionCalculationRequest request) {
        String code = request.getCode() != null ? request.getCode().trim().toUpperCase() : "";
        BigDecimal orderTotal = request.getOrderTotal() != null ? request.getOrderTotal() : BigDecimal.ZERO;

        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code).orElse(null);

        if (promotion == null) {
            return PromotionCalculationResponse.builder()
                    .valid(false)
                    .message("Mã khuyến mãi '" + code + "' không tồn tại trong hệ thống.")
                    .originalAmount(orderTotal)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderTotal)
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Kiểm tra trạng thái
        if (!"ACTIVE".equalsIgnoreCase(promotion.getStatus())) {
            return PromotionCalculationResponse.builder()
                    .valid(false)
                    .message("Mã khuyến mãi hiện đang tạm ngưng áp dụng.")
                    .originalAmount(orderTotal)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderTotal)
                    .promotion(toResponse(promotion))
                    .build();
        }

        // 2. Kiểm tra thời gian hiệu lực
        if (now.isBefore(promotion.getStartDate())) {
            return PromotionCalculationResponse.builder()
                    .valid(false)
                    .message("Chương trình khuyến mãi chưa bắt đầu.")
                    .originalAmount(orderTotal)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderTotal)
                    .promotion(toResponse(promotion))
                    .build();
        }

        if (now.isAfter(promotion.getEndDate())) {
            return PromotionCalculationResponse.builder()
                    .valid(false)
                    .message("Mã khuyến mãi đã hết hạn sử dụng.")
                    .originalAmount(orderTotal)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderTotal)
                    .promotion(toResponse(promotion))
                    .build();
        }

        // 3. Kiểm tra số lượt sử dụng
        if (promotion.getUsageLimit() != null && promotion.getUsedCount() >= promotion.getUsageLimit()) {
            return PromotionCalculationResponse.builder()
                    .valid(false)
                    .message("Mã khuyến mãi đã hết lượt sử dụng.")
                    .originalAmount(orderTotal)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderTotal)
                    .promotion(toResponse(promotion))
                    .build();
        }

        // 4. Áp dụng Strategy Pattern để tính số tiền giảm giá
        try {
            DiscountStrategy strategy = strategyFactory.getStrategy(promotion.getType());
            BigDecimal discount = strategy.calculateDiscount(promotion, orderTotal);
            BigDecimal finalAmount = orderTotal.subtract(discount).max(BigDecimal.ZERO);

            return PromotionCalculationResponse.builder()
                    .valid(true)
                    .message("Áp dụng mã khuyến mãi thành công! Bạn được giảm: " + String.format("%,d đ", discount.longValue()))
                    .originalAmount(orderTotal)
                    .discountAmount(discount)
                    .finalAmount(finalAmount)
                    .promotion(toResponse(promotion))
                    .build();

        } catch (IllegalArgumentException e) {
            return PromotionCalculationResponse.builder()
                    .valid(false)
                    .message(e.getMessage())
                    .originalAmount(orderTotal)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderTotal)
                    .promotion(toResponse(promotion))
                    .build();
        }
    }

    /**
     * Áp dụng mã khuyến mãi vào Đơn hàng (Order)
     */
    public OrderResponse applyPromotionToOrder(Long orderId, String code) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;

        PromotionCalculationResponse calcResult = calculatePromotion(
                PromotionCalculationRequest.builder()
                        .code(code)
                        .orderTotal(orderTotal)
                        .orderId(orderId)
                        .build()
        );

        if (!calcResult.isValid()) {
            throw new IllegalArgumentException(calcResult.getMessage());
        }

        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code.trim().toUpperCase()).orElse(null);

        order.setPromotionId(promotion != null ? promotion.getId() : null);
        order.setPromotionCode(code.trim().toUpperCase());
        order.setDiscountAmount(calcResult.getDiscountAmount());
        order.setFinalAmount(calcResult.getFinalAmount());
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);

        // Tăng số lượt dùng của promotion
        if (promotion != null) {
            promotion.setUsedCount(promotion.getUsedCount() + 1);
            if (promotion.getUsageLimit() != null && promotion.getUsedCount() >= promotion.getUsageLimit()) {
                promotion.setStatus("EXPIRED");
            }
            promotionRepository.save(promotion);
        }

        return OrderResponse.builder()
                .id(saved.getId())
                .status(saved.getStatus())
                .totalAmount(saved.getTotalAmount())
                .promotionId(saved.getPromotionId())
                .promotionCode(saved.getPromotionCode())
                .discountAmount(saved.getDiscountAmount())
                .finalAmount(saved.getFinalAmount())
                .note(saved.getNote())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .tableId(saved.getTable() != null ? saved.getTable().getId() : null)
                .tableNumber(saved.getTable() != null ? saved.getTable().getTableNumber() : null)
                .build();
    }

    /**
     * Tăng số lượt sử dụng của promotion khi hoàn tất thanh toán
     */
    public void incrementUsedCount(String code) {
        if (code == null || code.isBlank()) return;
        promotionRepository.findByCodeIgnoreCase(code.trim()).ifPresent(p -> {
            p.setUsedCount((p.getUsedCount() != null ? p.getUsedCount() : 0) + 1);
            if (p.getUsageLimit() != null && p.getUsedCount() >= p.getUsageLimit()) {
                p.setStatus("EXPIRED");
            }
            promotionRepository.save(p);
        });
    }

    // ── 4. Helper Mapper ──────────────────────────────────────────────

    private PromotionResponse toResponse(Promotion p) {
        LocalDateTime now = LocalDateTime.now();
        boolean isExpired = "EXPIRED".equalsIgnoreCase(p.getStatus())
                || now.isAfter(p.getEndDate())
                || (p.getUsageLimit() != null && p.getUsedCount() >= p.getUsageLimit());

        return PromotionResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .title(p.getTitle())
                .description(p.getDescription())
                .type(p.getType())
                .discountValue(p.getDiscountValue())
                .maxDiscount(p.getMaxDiscount())
                .minOrderAmount(p.getMinOrderAmount())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .usageLimit(p.getUsageLimit())
                .usedCount(p.getUsedCount())
                .status(p.getStatus())
                .isExpired(isExpired)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
