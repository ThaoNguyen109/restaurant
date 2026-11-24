package com.restaurant.restaurant_management.strategy.discount;

import com.restaurant.restaurant_management.entity.Promotion;
import com.restaurant.restaurant_management.entity.PromotionType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Concrete Strategy: Tính giảm giá theo phần trăm (%)
 * Có hỗ trợ kiểm tra giá trị đơn tối thiểu (minOrderAmount) và mức giảm tối đa (maxDiscount)
 */
@Component
public class PercentageDiscountStrategy implements DiscountStrategy {

    @Override
    public PromotionType getSupportedType() {
        return PromotionType.PERCENTAGE;
    }

    @Override
    public void validateConditions(Promotion promotion, BigDecimal orderTotal) {
        if (orderTotal == null || orderTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Đơn hàng chưa có món ăn để áp dụng khuyến mãi.");
        }

        if (promotion.getMinOrderAmount() != null && orderTotal.compareTo(promotion.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Đơn hàng tối thiểu để áp dụng mã này là %,d đ. Giá trị hiện tại: %,d đ.",
                    promotion.getMinOrderAmount().longValue(),
                    orderTotal.longValue()
            ));
        }
    }

    @Override
    public BigDecimal calculateDiscount(Promotion promotion, BigDecimal orderTotal) {
        validateConditions(promotion, orderTotal);

        BigDecimal percent = promotion.getDiscountValue();
        if (percent == null || percent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // discount = orderTotal * (percent / 100)
        BigDecimal calculatedDiscount = orderTotal
                .multiply(percent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        // Giới hạn mức giảm giá tối đa nếu có cấu hình maxDiscount
        if (promotion.getMaxDiscount() != null && promotion.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
            calculatedDiscount = calculatedDiscount.min(promotion.getMaxDiscount());
        }

        // Không bao giờ giảm vượt quá giá trị đơn hàng
        return calculatedDiscount.min(orderTotal);
    }
}
