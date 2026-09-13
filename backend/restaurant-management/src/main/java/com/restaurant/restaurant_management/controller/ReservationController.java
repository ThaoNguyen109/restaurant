package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.ReservationRequest;
import com.restaurant.restaurant_management.dto.ReservationResponse;
import com.restaurant.restaurant_management.dto.ReservationStatusRequest;
import com.restaurant.restaurant_management.service.ReservationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * POST /api/reservations
     * Khách hàng đặt bàn – KHÔNG cần xác thực (public)
     */
    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody ReservationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.createReservation(request));
    }

    /**
     * GET /api/reservations
     * Admin xem danh sách đặt bàn
     * Query params: status, date (yyyy-MM-dd), search
     */
    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getReservations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(reservationService.getAllReservations(status, date, search));
    }

    /**
     * GET /api/reservations/{id}
     * Lấy chi tiết một đặt bàn
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getById(id));
    }

    /**
     * PUT /api/reservations/{id}
     * Admin cập nhật thông tin đặt bàn
     */
    @PutMapping("/{id}")
    public ResponseEntity<ReservationResponse> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequest request
    ) {
        return ResponseEntity.ok(reservationService.updateReservation(id, request));
    }

    /**
     * PATCH /api/reservations/{id}/status
     * Cập nhật nhanh trạng thái (PENDING → CONFIRMED → COMPLETED…)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ReservationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReservationStatusRequest request
    ) {
        return ResponseEntity.ok(reservationService.updateStatus(id, request));
    }

    /**
     * DELETE /api/reservations/{id}
     * Xoá đặt bàn (admin)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.ok(Map.of("message", "Xoá đặt bàn thành công"));
    }

    /**
     * GET /api/reservations/stats/today
     * Đếm số đặt bàn hôm nay (PENDING + CONFIRMED)
     */
    @GetMapping("/stats/today")
    public ResponseEntity<Map<String, Long>> countToday() {
        return ResponseEntity.ok(Map.of("count", reservationService.countTodayReservations()));
    }
}
