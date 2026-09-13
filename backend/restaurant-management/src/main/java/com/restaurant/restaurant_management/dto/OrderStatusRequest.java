package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
        regexp = "PENDING|CONFIRMED|PREPARING|SERVING|COMPLETED|CANCELLED",
        message = "Trạng thái phải là: PENDING, CONFIRMED, PREPARING, SERVING, COMPLETED hoặc CANCELLED"
    )
    private String status;
}
