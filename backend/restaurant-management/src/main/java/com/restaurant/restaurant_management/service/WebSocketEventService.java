package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.OrderResponse;
import com.restaurant.restaurant_management.dto.ReservationResponse;
import com.restaurant.restaurant_management.dto.RestaurantTableResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SocketEvent<T> {
        private String eventType;
        private String message;
        private String timestamp;
        private T data;
    }

    public void sendKitchenEvent(String eventType, String message, OrderResponse order) {
        try {
            SocketEvent<OrderResponse> event = SocketEvent.<OrderResponse>builder()
                    .eventType(eventType)
                    .message(message)
                    .timestamp(LocalDateTime.now().toString())
                    .data(order)
                    .build();
            messagingTemplate.convertAndSend("/topic/kitchen", event);
            log.info("Sent WebSocket event to /topic/kitchen: {}", eventType);
        } catch (Exception e) {
            log.error("Failed to send kitchen websocket event", e);
        }
    }

    public void sendOrderEvent(String eventType, String message, OrderResponse order) {
        try {
            SocketEvent<OrderResponse> event = SocketEvent.<OrderResponse>builder()
                    .eventType(eventType)
                    .message(message)
                    .timestamp(LocalDateTime.now().toString())
                    .data(order)
                    .build();
            messagingTemplate.convertAndSend("/topic/orders", event);
            log.info("Sent WebSocket event to /topic/orders: {}", eventType);
        } catch (Exception e) {
            log.error("Failed to send order websocket event", e);
        }
    }

    public void sendTableEvent(String eventType, String message, RestaurantTableResponse table) {
        try {
            SocketEvent<RestaurantTableResponse> event = SocketEvent.<RestaurantTableResponse>builder()
                    .eventType(eventType)
                    .message(message)
                    .timestamp(LocalDateTime.now().toString())
                    .data(table)
                    .build();
            messagingTemplate.convertAndSend("/topic/tables", event);
            log.info("Sent WebSocket event to /topic/tables: {}", eventType);
        } catch (Exception e) {
            log.error("Failed to send table websocket event", e);
        }
    }

    public void sendReservationEvent(String eventType, String message, ReservationResponse reservation) {
        try {
            SocketEvent<ReservationResponse> event = SocketEvent.<ReservationResponse>builder()
                    .eventType(eventType)
                    .message(message)
                    .timestamp(LocalDateTime.now().toString())
                    .data(reservation)
                    .build();
            messagingTemplate.convertAndSend("/topic/reservations", event);
            log.info("Sent WebSocket event to /topic/reservations: {}", eventType);
        } catch (Exception e) {
            log.error("Failed to send reservation websocket event", e);
        }
    }
}
