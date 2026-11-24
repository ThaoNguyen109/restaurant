package com.restaurant.restaurant_management.strategy.discount;

import com.restaurant.restaurant_management.entity.PromotionType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Factory Pattern kết hợp Strategy Pattern:
 * Tự động đăng ký và cung cấp Strategy tính toán giảm giá phù hợp dựa trên PromotionType
 */
@Component
public class PromotionStrategyFactory {

    private final Map<PromotionType, DiscountStrategy> strategies = new EnumMap<>(PromotionType.class);

    public PromotionStrategyFactory(List<DiscountStrategy> strategyList) {
        for (DiscountStrategy strategy : strategyList) {
            strategies.put(strategy.getSupportedType(), strategy);
        }
    }

    public DiscountStrategy getStrategy(PromotionType type) {
        DiscountStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new UnsupportedOperationException("Chưa hỗ trợ loại khuyến mãi: " + type);
        }
        return strategy;
    }
}
