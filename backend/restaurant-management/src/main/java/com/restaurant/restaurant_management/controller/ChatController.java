package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.ChatRequest;
import com.restaurant.restaurant_management.dto.ChatResponse;
import com.restaurant.restaurant_management.service.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final GeminiService geminiService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = geminiService.chat(request);
        return ResponseEntity.ok(response);
    }
}
