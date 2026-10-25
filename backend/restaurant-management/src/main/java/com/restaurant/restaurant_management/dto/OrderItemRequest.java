package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class OrderItemRequest {

    private Long menuItemId;

    private Long comboId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
    private Integer quantity = 1;

    private String note;

    public OrderItemRequest() {
    }

    public OrderItemRequest(Long menuItemId, Long comboId, Integer quantity, String note) {
        this.menuItemId = menuItemId;
        this.comboId = comboId;
        this.quantity = quantity != null ? quantity : 1;
        this.note = note;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Long getComboId() {
        return comboId;
    }

    public void setComboId(Long comboId) {
        this.comboId = comboId;
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
