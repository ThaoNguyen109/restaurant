package com.restaurant.restaurant_management.dto;

import java.math.BigDecimal;

public class OrderStatsResponse {
    private long totalOrdersToday;
    private long pendingOrders;
    private long preparingOrders;
    private long servingOrders;
    private long completedOrdersToday;
    private BigDecimal revenueToday;

    public OrderStatsResponse() {
    }

    public OrderStatsResponse(long totalOrdersToday, long pendingOrders, long preparingOrders,
                              long servingOrders, long completedOrdersToday, BigDecimal revenueToday) {
        this.totalOrdersToday = totalOrdersToday;
        this.pendingOrders = pendingOrders;
        this.preparingOrders = preparingOrders;
        this.servingOrders = servingOrders;
        this.completedOrdersToday = completedOrdersToday;
        this.revenueToday = revenueToday;
    }

    public static OrderStatsResponseBuilder builder() {
        return new OrderStatsResponseBuilder();
    }

    public long getTotalOrdersToday() {
        return totalOrdersToday;
    }

    public void setTotalOrdersToday(long totalOrdersToday) {
        this.totalOrdersToday = totalOrdersToday;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getPreparingOrders() {
        return preparingOrders;
    }

    public void setPreparingOrders(long preparingOrders) {
        this.preparingOrders = preparingOrders;
    }

    public long getServingOrders() {
        return servingOrders;
    }

    public void setServingOrders(long servingOrders) {
        this.servingOrders = servingOrders;
    }

    public long getCompletedOrdersToday() {
        return completedOrdersToday;
    }

    public void setCompletedOrdersToday(long completedOrdersToday) {
        this.completedOrdersToday = completedOrdersToday;
    }

    public BigDecimal getRevenueToday() {
        return revenueToday;
    }

    public void setRevenueToday(BigDecimal revenueToday) {
        this.revenueToday = revenueToday;
    }

    public static class OrderStatsResponseBuilder {
        private long totalOrdersToday;
        private long pendingOrders;
        private long preparingOrders;
        private long servingOrders;
        private long completedOrdersToday;
        private BigDecimal revenueToday;

        public OrderStatsResponseBuilder totalOrdersToday(long totalOrdersToday) {
            this.totalOrdersToday = totalOrdersToday;
            return this;
        }

        public OrderStatsResponseBuilder pendingOrders(long pendingOrders) {
            this.pendingOrders = pendingOrders;
            return this;
        }

        public OrderStatsResponseBuilder preparingOrders(long preparingOrders) {
            this.preparingOrders = preparingOrders;
            return this;
        }

        public OrderStatsResponseBuilder servingOrders(long servingOrders) {
            this.servingOrders = servingOrders;
            return this;
        }

        public OrderStatsResponseBuilder completedOrdersToday(long completedOrdersToday) {
            this.completedOrdersToday = completedOrdersToday;
            return this;
        }

        public OrderStatsResponseBuilder revenueToday(BigDecimal revenueToday) {
            this.revenueToday = revenueToday;
            return this;
        }

        public OrderStatsResponse build() {
            return new OrderStatsResponse(totalOrdersToday, pendingOrders, preparingOrders, servingOrders, completedOrdersToday, revenueToday);
        }
    }
}
