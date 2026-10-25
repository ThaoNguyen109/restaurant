package com.restaurant.restaurant_management.dto;

public class VNPayPaymentResponse {
    private String status;
    private String message;
    private String paymentUrl;
    private Long orderId;
    private Long amount;
    private String txnRef;

    public VNPayPaymentResponse() {
    }

    public VNPayPaymentResponse(String status, String message, String paymentUrl, Long orderId, Long amount, String txnRef) {
        this.status = status;
        this.message = message;
        this.paymentUrl = paymentUrl;
        this.orderId = orderId;
        this.amount = amount;
        this.txnRef = txnRef;
    }

    public static VNPayPaymentResponseBuilder builder() {
        return new VNPayPaymentResponseBuilder();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getTxnRef() {
        return txnRef;
    }

    public void setTxnRef(String txnRef) {
        this.txnRef = txnRef;
    }

    public static class VNPayPaymentResponseBuilder {
        private String status;
        private String message;
        private String paymentUrl;
        private Long orderId;
        private Long amount;
        private String txnRef;

        public VNPayPaymentResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public VNPayPaymentResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public VNPayPaymentResponseBuilder paymentUrl(String paymentUrl) {
            this.paymentUrl = paymentUrl;
            return this;
        }

        public VNPayPaymentResponseBuilder orderId(Long orderId) {
            this.orderId = orderId;
            return this;
        }

        public VNPayPaymentResponseBuilder amount(Long amount) {
            this.amount = amount;
            return this;
        }

        public VNPayPaymentResponseBuilder txnRef(String txnRef) {
            this.txnRef = txnRef;
            return this;
        }

        public VNPayPaymentResponse build() {
            return new VNPayPaymentResponse(status, message, paymentUrl, orderId, amount, txnRef);
        }
    }
}
