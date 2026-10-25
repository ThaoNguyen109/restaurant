package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OrderStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
        regexp = "PENDING|CONFIRMED|PREPARING|SERVING|COMPLETED|CANCELLED|BILLING_REQUESTED",
        message = "Trạng thái phải là: PENDING, CONFIRMED, PREPARING, SERVING, COMPLETED, CANCELLED hoặc BILLING_REQUESTED"
    )
    private String status;

    public OrderStatusRequest() {
    }

    public OrderStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
