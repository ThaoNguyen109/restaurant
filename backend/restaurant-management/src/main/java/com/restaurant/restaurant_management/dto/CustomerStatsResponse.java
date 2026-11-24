package com.restaurant.restaurant_management.dto;

import java.math.BigDecimal;

public class CustomerStatsResponse {

    private long totalCustomers;
    private long bronzeCount;
    private long silverCount;
    private long goldCount;
    private long vipCount;
    private long activeCount;
    private long inactiveCount;
    private BigDecimal totalRevenue;
    private long totalLoyaltyPoints;

    // ── Getters & Setters ──────────────────────────────────────────

    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getBronzeCount() { return bronzeCount; }
    public void setBronzeCount(long bronzeCount) { this.bronzeCount = bronzeCount; }

    public long getSilverCount() { return silverCount; }
    public void setSilverCount(long silverCount) { this.silverCount = silverCount; }

    public long getGoldCount() { return goldCount; }
    public void setGoldCount(long goldCount) { this.goldCount = goldCount; }

    public long getVipCount() { return vipCount; }
    public void setVipCount(long vipCount) { this.vipCount = vipCount; }

    public long getActiveCount() { return activeCount; }
    public void setActiveCount(long activeCount) { this.activeCount = activeCount; }

    public long getInactiveCount() { return inactiveCount; }
    public void setInactiveCount(long inactiveCount) { this.inactiveCount = inactiveCount; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getTotalLoyaltyPoints() { return totalLoyaltyPoints; }
    public void setTotalLoyaltyPoints(long totalLoyaltyPoints) { this.totalLoyaltyPoints = totalLoyaltyPoints; }
}
