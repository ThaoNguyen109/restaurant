package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionCalculationRequest {

    @NotBlank(message = "Vui lòng nhập mã khuyến mãi")
    private String code;

    @NotNull(message = "Tổng tiền đơn hàng không được để trống")
    private BigDecimal orderTotal;

    private Long orderId;
}
