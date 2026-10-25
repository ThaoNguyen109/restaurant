package com.restaurant.restaurant_management.dto;

public class VNPayCallbackResponse {
    private boolean success;
    private String responseCode;
    private String message;
    private Long orderId;
    private String txnRef;
    private Long amount;
    private String bankCode;
    private String transactionNo;
    private String payDate;
    private OrderResponse order;

    public VNPayCallbackResponse() {
    }

    public VNPayCallbackResponse(boolean success, String responseCode, String message, Long orderId,
                                 String txnRef, Long amount, String bankCode, String transactionNo,
                                 String payDate, OrderResponse order) {
        this.success = success;
        this.responseCode = responseCode;
        this.message = message;
        this.orderId = orderId;
        this.txnRef = txnRef;
        this.amount = amount;
        this.bankCode = bankCode;
        this.transactionNo = transactionNo;
        this.payDate = payDate;
        this.order = order;
    }

    public static VNPayCallbackResponseBuilder builder() {
        return new VNPayCallbackResponseBuilder();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getResponseCode() {
        return responseCode;
    }

    public void setResponseCode(String responseCode) {
        this.responseCode = responseCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getTxnRef() {
        return txnRef;
    }

    public void setTxnRef(String txnRef) {
        this.txnRef = txnRef;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getTransactionNo() {
        return transactionNo;
    }

    public void setTransactionNo(String transactionNo) {
        this.transactionNo = transactionNo;
    }

    public String getPayDate() {
        return payDate;
    }

    public void setPayDate(String payDate) {
        this.payDate = payDate;
    }

    public OrderResponse getOrder() {
        return order;
    }

    public void setOrder(OrderResponse order) {
        this.order = order;
    }

    public static class VNPayCallbackResponseBuilder {
        private boolean success;
        private String responseCode;
        private String message;
        private Long orderId;
        private String txnRef;
        private Long amount;
        private String bankCode;
        private String transactionNo;
        private String payDate;
        private OrderResponse order;

        public VNPayCallbackResponseBuilder success(boolean success) {
            this.success = success;
            return this;
        }

        public VNPayCallbackResponseBuilder responseCode(String responseCode) {
            this.responseCode = responseCode;
            return this;
        }

        public VNPayCallbackResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public VNPayCallbackResponseBuilder orderId(Long orderId) {
            this.orderId = orderId;
            return this;
        }

        public VNPayCallbackResponseBuilder txnRef(String txnRef) {
            this.txnRef = txnRef;
            return this;
        }

        public VNPayCallbackResponseBuilder amount(Long amount) {
            this.amount = amount;
            return this;
        }

        public VNPayCallbackResponseBuilder bankCode(String bankCode) {
            this.bankCode = bankCode;
            return this;
        }

        public VNPayCallbackResponseBuilder transactionNo(String transactionNo) {
            this.transactionNo = transactionNo;
            return this;
        }

        public VNPayCallbackResponseBuilder payDate(String payDate) {
            this.payDate = payDate;
            return this;
        }

        public VNPayCallbackResponseBuilder order(OrderResponse order) {
            this.order = order;
            return this;
        }

        public VNPayCallbackResponse build() {
            return new VNPayCallbackResponse(success, responseCode, message, orderId, txnRef, amount, bankCode, transactionNo, payDate, order);
        }
    }
}
