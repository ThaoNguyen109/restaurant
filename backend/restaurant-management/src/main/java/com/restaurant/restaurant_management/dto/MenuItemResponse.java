package com.restaurant.restaurant_management.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MenuItemResponse {

    private Long id;
    private String name;
    private String description;
    private String mainIngredients;
    private BigDecimal price;
    private String image;
    private String status;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MenuItemResponse() {
    }

    public MenuItemResponse(Long id, String name, String description, String mainIngredients, BigDecimal price,
                            String image, String status, Long categoryId, String categoryName,
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.mainIngredients = mainIngredients;
        this.price = price;
        this.image = image;
        this.status = status;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static MenuItemResponseBuilder builder() {
        return new MenuItemResponseBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getMainIngredients() {
        return mainIngredients;
    }

    public void setMainIngredients(String mainIngredients) {
        this.mainIngredients = mainIngredients;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class MenuItemResponseBuilder {
        private Long id;
        private String name;
        private String description;
        private String mainIngredients;
        private BigDecimal price;
        private String image;
        private String status;
        private Long categoryId;
        private String categoryName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public MenuItemResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public MenuItemResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public MenuItemResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public MenuItemResponseBuilder mainIngredients(String mainIngredients) {
            this.mainIngredients = mainIngredients;
            return this;
        }

        public MenuItemResponseBuilder price(BigDecimal price) {
            this.price = price;
            return this;
        }

        public MenuItemResponseBuilder image(String image) {
            this.image = image;
            return this;
        }

        public MenuItemResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public MenuItemResponseBuilder categoryId(Long categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public MenuItemResponseBuilder categoryName(String categoryName) {
            this.categoryName = categoryName;
            return this;
        }

        public MenuItemResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public MenuItemResponseBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public MenuItemResponse build() {
            return new MenuItemResponse(id, name, description, mainIngredients, price, image, status, categoryId, categoryName, createdAt, updatedAt);
        }
    }
}
