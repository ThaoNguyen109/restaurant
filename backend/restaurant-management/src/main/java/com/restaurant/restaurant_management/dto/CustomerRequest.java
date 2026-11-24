package com.restaurant.restaurant_management.dto;

import java.time.LocalDate;

public class CustomerRequest {

    private String name;
    private String phone;
    private String email;
    private LocalDate birthday;
    private String gender;   // MALE / FEMALE / OTHER
    private String address;
    private String tier;     // BRONZE / SILVER / GOLD / VIP (admin override)
    private Integer loyaltyPoints;
    private String note;
    private String status;   // ACTIVE / INACTIVE / BLOCKED

    // ── Getters & Setters ──────────────────────────────────────────

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

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
