package com.restaurant.restaurant_management.dto;

public class UpdateOrderRequest {

    private Long tableId;

    private String note;

    public UpdateOrderRequest() {
    }

    public UpdateOrderRequest(Long tableId, String note) {
        this.tableId = tableId;
        this.note = note;
    }

    public Long getTableId() {
        return tableId;
    }

    public void setTableId(Long tableId) {
        this.tableId = tableId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
