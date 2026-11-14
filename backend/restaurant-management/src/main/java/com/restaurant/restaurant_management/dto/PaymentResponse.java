package com.restaurant.restaurant_management.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private Integer tableNumber;
    private BigDecimal amount;
    private String paymentMethod;
    private String status;
    private String transactionCode;
    private String txnRef;
    private String bankCode;
    private BigDecimal cashGiven;
    private BigDecimal changeAmount;
    private BigDecimal discountAmount;
    private Integer discountPercent;
    private String note;
    private LocalDateTime createdAt;
}

