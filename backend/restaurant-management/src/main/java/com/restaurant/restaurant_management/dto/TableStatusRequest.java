package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TableStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
        regexp = "AVAILABLE|OCCUPIED|RESERVED|MAINTENANCE|INACTIVE",
        message = "Trạng thái không hợp lệ. Chỉ chấp nhận: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, INACTIVE"
    )
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
