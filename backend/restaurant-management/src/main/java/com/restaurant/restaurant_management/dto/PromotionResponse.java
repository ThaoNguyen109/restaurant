package com.restaurant.restaurant_management.dto;

import com.restaurant.restaurant_management.entity.PromotionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionResponse {
    private Long id;
    private String code;
    private String title;
    private String description;
    private PromotionType type;
    private BigDecimal discountValue;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;
    private Integer usedCount;
    private String status;
    private boolean isExpired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
