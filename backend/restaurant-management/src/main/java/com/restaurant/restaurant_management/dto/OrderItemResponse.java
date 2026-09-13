package com.restaurant.restaurant_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
