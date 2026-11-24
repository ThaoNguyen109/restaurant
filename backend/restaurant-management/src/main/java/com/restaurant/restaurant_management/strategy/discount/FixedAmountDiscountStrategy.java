package com.restaurant.restaurant_management.strategy.discount;

import com.restaurant.restaurant_management.entity.Promotion;
import com.restaurant.restaurant_management.entity.PromotionType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete Strategy: Giảm trừ trực tiếp số tiền cố định (Ví dụ: Giảm 30.000đ, 50.000đ)
 */
@Component
public class FixedAmountDiscountStrategy implements DiscountStrategy {

    @Override
    public PromotionType getSupportedType() {
        return PromotionType.FIXED_AMOUNT;
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

        BigDecimal discount = promotion.getDiscountValue();
        if (discount == null || discount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // Số tiền giảm tối đa bằng tổng giá trị đơn hàng (không để âm tiền)
        return discount.min(orderTotal);
    }
}
