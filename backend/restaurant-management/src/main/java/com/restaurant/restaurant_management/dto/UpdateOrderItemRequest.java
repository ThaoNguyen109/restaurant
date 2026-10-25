package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.Min;

public class UpdateOrderItemRequest {

    @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
    private Integer quantity;

    private String note;

    public UpdateOrderItemRequest() {
    }

    public UpdateOrderItemRequest(Integer quantity, String note) {
        this.quantity = quantity;
        this.note = note;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
