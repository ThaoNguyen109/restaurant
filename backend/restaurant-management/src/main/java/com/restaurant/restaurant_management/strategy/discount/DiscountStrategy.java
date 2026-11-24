package com.restaurant.restaurant_management.strategy.discount;

import com.restaurant.restaurant_management.entity.Promotion;
import com.restaurant.restaurant_management.entity.PromotionType;

import java.math.BigDecimal;

/**
 * Strategy Pattern: Interface định nghĩa chiến lược tính toán giảm giá cho từng loại khuyến mãi
 */
public interface DiscountStrategy {

    /**
     * Trả về loại khuyến mãi mà strategy này xử lý (PERCENTAGE, FIXED_AMOUNT, ...)
     */
    PromotionType getSupportedType();

    /**
     * Kiểm tra điều kiện đơn hàng có đủ điều kiện áp dụng khuyến mãi không
     */
    void validateConditions(Promotion promotion, BigDecimal orderTotal);

    /**
     * Tính toán số tiền được giảm giá theo chiến lược cụ thể
     */
    BigDecimal calculateDiscount(Promotion promotion, BigDecimal orderTotal);
}
