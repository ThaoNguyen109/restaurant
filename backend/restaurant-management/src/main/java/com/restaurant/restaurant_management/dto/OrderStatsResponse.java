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
public class OrderStatsResponse {
    private long totalOrdersToday;
    private long pendingOrders;
    private long preparingOrders;
    private long servingOrders;
    private long completedOrdersToday;
    private BigDecimal revenueToday;
}
