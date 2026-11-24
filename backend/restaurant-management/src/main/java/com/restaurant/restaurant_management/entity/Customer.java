package com.restaurant.restaurant_management.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 20, unique = true)
    private String phone;

    @Column(length = 150, unique = true)
    private String email;

    @Column
    private LocalDate birthday;

    @Column(length = 10)
    private String gender; // MALE / FEMALE / OTHER

    @Column(length = 255)
    private String address;

    /**
     * BRONZE  — mặc định
     * SILVER  — total_spent >= 2.000.000 hoặc visit_count >= 10
     * GOLD    — total_spent >= 10.000.000 hoặc visit_count >= 30
     * VIP     — total_spent >= 50.000.000 hoặc thủ công nâng
     */
    @Column(nullable = false, length = 20)
    private String tier = "BRONZE";

    @Column(name = "loyalty_points", nullable = false)
    private Integer loyaltyPoints = 0;

    @Column(name = "total_spent", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "visit_count", nullable = false)
    private Integer visitCount = 0;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** ACTIVE / INACTIVE / BLOCKED */
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        recalculateTier();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        recalculateTier();
    }

    /** Tự động nâng hạng dựa trên chi tiêu và số lần ghé thăm */
    public void recalculateTier() {
        if ("VIP".equals(tier)) return; // VIP được giữ nguyên trừ khi admin điều chỉnh
        BigDecimal spent = totalSpent != null ? totalSpent : BigDecimal.ZERO;
        int visits = visitCount != null ? visitCount : 0;
        if (spent.compareTo(new java.math.BigDecimal("50000000")) >= 0) {
            tier = "VIP";
        } else if (spent.compareTo(new java.math.BigDecimal("10000000")) >= 0 || visits >= 30) {
            tier = "GOLD";
        } else if (spent.compareTo(new java.math.BigDecimal("2000000")) >= 0 || visits >= 10) {
            tier = "SILVER";
        } else {
            tier = "BRONZE";
        }
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
}
