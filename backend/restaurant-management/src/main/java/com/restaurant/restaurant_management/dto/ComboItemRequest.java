package com.restaurant.restaurant_management.dto;

public class ComboItemRequest {

    private Long menuItemId;
    private Integer quantity = 1;

    public ComboItemRequest() {
    }

    public ComboItemRequest(Long menuItemId, Integer quantity) {
        this.menuItemId = menuItemId;
        this.quantity = quantity;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
