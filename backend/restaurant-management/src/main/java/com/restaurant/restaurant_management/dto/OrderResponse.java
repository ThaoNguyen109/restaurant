package com.restaurant.restaurant_management.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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

    public OrderResponse() {
    }

    public OrderResponse(Long id, Long tableId, Integer tableNumber, Integer tableCapacity, String status,
                         BigDecimal totalAmount, String note, LocalDateTime createdAt, LocalDateTime updatedAt,
                         List<OrderItemResponse> items, Integer totalItemCount) {
        this.id = id;
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.tableCapacity = tableCapacity;
        this.status = status;
        this.totalAmount = totalAmount;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.items = items;
        this.totalItemCount = totalItemCount;
    }

    public static OrderResponseBuilder builder() {
        return new OrderResponseBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTableId() {
        return tableId;
    }

    public void setTableId(Long tableId) {
        this.tableId = tableId;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Integer getTableCapacity() {
        return tableCapacity;
    }

    public void setTableCapacity(Integer tableCapacity) {
        this.tableCapacity = tableCapacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    public Integer getTotalItemCount() {
        return totalItemCount;
    }

    public void setTotalItemCount(Integer totalItemCount) {
        this.totalItemCount = totalItemCount;
    }

    public static class OrderResponseBuilder {
        private Long id;
        private Long tableId;
        private Integer tableNumber;
        private Integer tableCapacity;
        private String status;
        private BigDecimal totalAmount;
        private String note;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<OrderItemResponse> items;
        private Integer totalItemCount;

        public OrderResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public OrderResponseBuilder tableId(Long tableId) {
            this.tableId = tableId;
            return this;
        }

        public OrderResponseBuilder tableNumber(Integer tableNumber) {
            this.tableNumber = tableNumber;
            return this;
        }

        public OrderResponseBuilder tableCapacity(Integer tableCapacity) {
            this.tableCapacity = tableCapacity;
            return this;
        }

        public OrderResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public OrderResponseBuilder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public OrderResponseBuilder note(String note) {
            this.note = note;
            return this;
        }

        public OrderResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public OrderResponseBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public OrderResponseBuilder items(List<OrderItemResponse> items) {
            this.items = items;
            return this;
        }

        public OrderResponseBuilder totalItemCount(Integer totalItemCount) {
            this.totalItemCount = totalItemCount;
            return this;
        }

        public OrderResponse build() {
            return new OrderResponse(id, tableId, tableNumber, tableCapacity, status, totalAmount, note, createdAt, updatedAt, items, totalItemCount);
        }
    }
}
