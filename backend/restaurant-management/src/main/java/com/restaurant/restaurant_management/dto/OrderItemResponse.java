package com.restaurant.restaurant_management.dto;

import java.math.BigDecimal;

public class OrderItemResponse {

    private Long id;
    private Long orderId;

    // MenuItem details if applicable
    private Long menuItemId;
    private String menuItemName;
    private String menuItemImage;

    // Combo details if applicable
    private Long comboId;
    private String comboName;
    private String comboImage;

    // Display name & type helper
    private String itemName;
    private String itemType; // "MENU_ITEM" or "COMBO"
    private String image;

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String status;
    private String note;

    public OrderItemResponse() {
    }

    public OrderItemResponse(Long id, Long orderId, Long menuItemId, String menuItemName, String menuItemImage,
                             Long comboId, String comboName, String comboImage, String itemName, String itemType,
                             String image, Integer quantity, BigDecimal unitPrice, BigDecimal subtotal,
                             String status, String note) {
        this.id = id;
        this.orderId = orderId;
        this.menuItemId = menuItemId;
        this.menuItemName = menuItemName;
        this.menuItemImage = menuItemImage;
        this.comboId = comboId;
        this.comboName = comboName;
        this.comboImage = comboImage;
        this.itemName = itemName;
        this.itemType = itemType;
        this.image = image;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.status = status;
        this.note = note;
    }

    public static OrderItemResponseBuilder builder() {
        return new OrderItemResponseBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public void setMenuItemName(String menuItemName) {
        this.menuItemName = menuItemName;
    }

    public String getMenuItemImage() {
        return menuItemImage;
    }

    public void setMenuItemImage(String menuItemImage) {
        this.menuItemImage = menuItemImage;
    }

    public Long getComboId() {
        return comboId;
    }

    public void setComboId(Long comboId) {
        this.comboId = comboId;
    }

    public String getComboName() {
        return comboName;
    }

    public void setComboName(String comboName) {
        this.comboName = comboName;
    }

    public String getComboImage() {
        return comboImage;
    }

    public void setComboImage(String comboImage) {
        this.comboImage = comboImage;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public static class OrderItemResponseBuilder {
        private Long id;
        private Long orderId;
        private Long menuItemId;
        private String menuItemName;
        private String menuItemImage;
        private Long comboId;
        private String comboName;
        private String comboImage;
        private String itemName;
        private String itemType;
        private String image;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String status;
        private String note;

        public OrderItemResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public OrderItemResponseBuilder orderId(Long orderId) {
            this.orderId = orderId;
            return this;
        }

        public OrderItemResponseBuilder menuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
            return this;
        }

        public OrderItemResponseBuilder menuItemName(String menuItemName) {
            this.menuItemName = menuItemName;
            return this;
        }

        public OrderItemResponseBuilder menuItemImage(String menuItemImage) {
            this.menuItemImage = menuItemImage;
            return this;
        }

        public OrderItemResponseBuilder comboId(Long comboId) {
            this.comboId = comboId;
            return this;
        }

        public OrderItemResponseBuilder comboName(String comboName) {
            this.comboName = comboName;
            return this;
        }

        public OrderItemResponseBuilder comboImage(String comboImage) {
            this.comboImage = comboImage;
            return this;
        }

        public OrderItemResponseBuilder itemName(String itemName) {
            this.itemName = itemName;
            return this;
        }

        public OrderItemResponseBuilder itemType(String itemType) {
            this.itemType = itemType;
            return this;
        }

        public OrderItemResponseBuilder image(String image) {
            this.image = image;
            return this;
        }

        public OrderItemResponseBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public OrderItemResponseBuilder unitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
            return this;
        }

        public OrderItemResponseBuilder subtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public OrderItemResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public OrderItemResponseBuilder note(String note) {
            this.note = note;
            return this;
        }

        public OrderItemResponse build() {
            return new OrderItemResponse(id, orderId, menuItemId, menuItemName, menuItemImage, comboId, comboName,
                    comboImage, itemName, itemType, image, quantity, unitPrice, subtotal, status, note);
        }
    }
}
