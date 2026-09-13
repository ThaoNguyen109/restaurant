package com.restaurant.restaurant_management.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Bàn không được để trống")
    private Long tableId;

    private String note;

    @Valid
    private List<OrderItemRequest> items;
}
