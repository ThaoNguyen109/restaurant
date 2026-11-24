package com.restaurant.restaurant_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CustomerResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private LocalDate birthday;
    private String gender;
    private String address;
    private String tier;
    private Integer loyaltyPoints;
    private BigDecimal totalSpent;
    private Integer visitCount;
    private String note;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thống kê đơn hàng (populate khi load chi tiết)
    private List<CustomerOrderSummary> recentOrders;
    private Long totalOrders;

    // ── Inner DTO: tóm tắt một đơn hàng ──────────────────────────

    public static class CustomerOrderSummary {
        private Long orderId;
        private String tableNumber;
        private BigDecimal finalAmount;
        private String status;
        private LocalDateTime createdAt;

        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }

        public String getTableNumber() { return tableNumber; }
        public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

        public BigDecimal getFinalAmount() { return finalAmount; }
        public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    // ── Static factory ─────────────────────────────────────────────

    public static CustomerResponse from(com.restaurant.restaurant_management.entity.Customer c) {
        CustomerResponse r = new CustomerResponse();
        r.id            = c.getId();
        r.name          = c.getName();
        r.phone         = c.getPhone();
        r.email         = c.getEmail();
        r.birthday      = c.getBirthday();
        r.gender        = c.getGender();
        r.address       = c.getAddress();
        r.tier          = c.getTier();
        r.loyaltyPoints = c.getLoyaltyPoints();
        r.totalSpent    = c.getTotalSpent();
        r.visitCount    = c.getVisitCount();
        r.note          = c.getNote();
        r.status        = c.getStatus();
        r.createdAt     = c.getCreatedAt();
        r.updatedAt     = c.getUpdatedAt();
        return r;
    }

    // ── Getters & Setters ──────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public Integer getVisitCount() { return visitCount; }
    public void setVisitCount(Integer visitCount) { this.visitCount = visitCount; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<CustomerOrderSummary> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<CustomerOrderSummary> recentOrders) { this.recentOrders = recentOrders; }

    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
}
