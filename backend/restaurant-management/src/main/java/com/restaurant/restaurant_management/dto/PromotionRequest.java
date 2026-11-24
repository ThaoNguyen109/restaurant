package com.restaurant.restaurant_management.dto;

import com.restaurant.restaurant_management.entity.PromotionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    private String code;

    @NotBlank(message = "Tiêu đề khuyến mãi không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Loại khuyến mãi không được để trống")
    private PromotionType type;

    @NotNull(message = "Giá trị giảm giá không được để trống")
    private BigDecimal discountValue;

    private BigDecimal maxDiscount;

    private BigDecimal minOrderAmount;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDateTime endDate;

    private Integer usageLimit;

    private String status;
}
