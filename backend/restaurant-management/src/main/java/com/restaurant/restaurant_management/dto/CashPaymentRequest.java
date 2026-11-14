package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashPaymentRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Long orderId;

    private BigDecimal amount;

    /**
     * CASH, BANK_TRANSFER, CREDIT_CARD
     */
    private String paymentMethod;

    private BigDecimal cashGiven;

    private BigDecimal changeAmount;

    private BigDecimal discountAmount;

    private Integer discountPercent;

    private String note;
}

