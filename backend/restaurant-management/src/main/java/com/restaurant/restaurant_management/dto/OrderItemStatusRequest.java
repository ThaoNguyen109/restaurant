package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OrderItemStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
        regexp = "PENDING|COOKING|SERVED|CANCELLED",
        message = "Trạng thái món phải là: PENDING, COOKING, SERVED hoặc CANCELLED"
    )
    private String status;

    public OrderItemStatusRequest() {
    }

    public OrderItemStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
