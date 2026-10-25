package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class VNPayPaymentRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Long orderId;

    // Tuỳ chọn: nếu muốn thanh toán với số tiền tuỳ chỉnh (sau khi giảm giá), nếu null thì lấy totalAmount của Order
    private BigDecimal amount;

    // Tuỳ chọn: ngân hàng cụ thể (VNPAYQR, VNBANK, INTCARD), nếu để trống VNPay sẽ cho người dùng chọn
    private String bankCode;

    // Tuỳ chọn: ghi chú hoặc returnUrl tuỳ chỉnh
    private String orderInfo;

    public VNPayPaymentRequest() {
    }

    public VNPayPaymentRequest(Long orderId, BigDecimal amount, String bankCode, String orderInfo) {
        this.orderId = orderId;
        this.amount = amount;
        this.bankCode = bankCode;
        this.orderInfo = orderInfo;
    }

    public static VNPayPaymentRequestBuilder builder() {
        return new VNPayPaymentRequestBuilder();
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getOrderInfo() {
        return orderInfo;
    }

    public void setOrderInfo(String orderInfo) {
        this.orderInfo = orderInfo;
    }

    public static class VNPayPaymentRequestBuilder {
        private Long orderId;
        private BigDecimal amount;
        private String bankCode;
        private String orderInfo;

        public VNPayPaymentRequestBuilder orderId(Long orderId) {
            this.orderId = orderId;
            return this;
        }

        public VNPayPaymentRequestBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public VNPayPaymentRequestBuilder bankCode(String bankCode) {
            this.bankCode = bankCode;
            return this;
        }

        public VNPayPaymentRequestBuilder orderInfo(String orderInfo) {
            this.orderInfo = orderInfo;
            return this;
        }

        public VNPayPaymentRequest build() {
            return new VNPayPaymentRequest(orderId, amount, bankCode, orderInfo);
        }
    }
}
