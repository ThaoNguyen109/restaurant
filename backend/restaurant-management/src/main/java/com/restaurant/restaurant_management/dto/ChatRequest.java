package com.restaurant.restaurant_management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;

    private List<ChatMessageDto> history = new ArrayList<>();
}
