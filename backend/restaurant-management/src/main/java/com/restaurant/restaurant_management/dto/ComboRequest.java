package com.restaurant.restaurant_management.dto;

import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ComboRequest {

    private String name;
    private String description;
    private BigDecimal price;
    private String status;
    private MultipartFile image;
    private String itemsJson; // JSON string đại diện cho danh sách ComboItemRequest
    private List<ComboItemRequest> items = new ArrayList<>();

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public MultipartFile getImage() {
        return image;
    }

    public void setImage(MultipartFile image) {
        this.image = image;
    }

    public String getItemsJson() {
        return itemsJson;
    }

    public void setItemsJson(String itemsJson) {
        this.itemsJson = itemsJson;
    }

    public List<ComboItemRequest> getItems() {
        return items;
    }

    public void setItems(List<ComboItemRequest> items) {
        this.items = items;
    }
}