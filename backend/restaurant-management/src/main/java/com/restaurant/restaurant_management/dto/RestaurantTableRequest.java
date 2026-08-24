package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.*;

public class RestaurantTableRequest {

    @NotNull(message = "Số bàn không được để trống")
    @Min(value = 1, message = "Số bàn phải lớn hơn 0")
    private Integer tableNumber;

    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa phải ít nhất 1 người")
    @Max(value = 100, message = "Sức chứa không được vượt quá 100 người")
    private Integer capacity;

    private String status;

    public Integer getTableNumber() { return tableNumber; }
    public void setTableNumber(Integer tableNumber) { this.tableNumber = tableNumber; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
