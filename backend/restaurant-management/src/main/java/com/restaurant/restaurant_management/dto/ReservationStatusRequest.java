package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ReservationStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
        regexp = "PENDING|CONFIRMED|CANCELLED|COMPLETED|NO_SHOW",
        message = "Trạng thái không hợp lệ. Chỉ chấp nhận: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW"
    )
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
