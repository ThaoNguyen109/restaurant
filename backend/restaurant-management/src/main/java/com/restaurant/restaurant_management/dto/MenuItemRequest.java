package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemRequest {

    @NotBlank(message = "Tên món ăn không được để trống")
    private String name;

    private String description;

    private String mainIngredients;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private String status; // ACTIVE, INACTIVE, OUT_OF_STOCK

    private MultipartFile image; // File ảnh tải lên từ client (FormData)
}
