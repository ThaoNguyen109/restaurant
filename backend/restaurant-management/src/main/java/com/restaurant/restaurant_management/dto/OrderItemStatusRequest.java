package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
        regexp = "PENDING|COOKING|SERVED|CANCELLED",
        message = "Trạng thái món phải là: PENDING, COOKING, SERVED hoặc CANCELLED"
    )
    private String status;
}
