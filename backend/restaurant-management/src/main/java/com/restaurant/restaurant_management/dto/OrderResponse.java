package com.restaurant.restaurant_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;

    // Table info
    private Long tableId;
    private Integer tableNumber;
    private Integer tableCapacity;

    private String status;
    private BigDecimal totalAmount;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Items
    private List<OrderItemResponse> items;
    private Integer totalItemCount;
}
