package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.ReservationRequest;
import com.restaurant.restaurant_management.dto.ReservationResponse;
import com.restaurant.restaurant_management.dto.ReservationStatusRequest;
import com.restaurant.restaurant_management.entity.Reservation;
import com.restaurant.restaurant_management.entity.RestaurantTable;
import com.restaurant.restaurant_management.repository.ReservationRepository;
import com.restaurant.restaurant_management.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository restaurantTableRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              RestaurantTableRepository restaurantTableRepository) {
        this.reservationRepository = reservationRepository;
        this.restaurantTableRepository = restaurantTableRepository;
    }

    // ── Mapper ─────────────────────────────────────────────────────
    private ReservationResponse toResponse(Reservation r) {
        ReservationResponse res = new ReservationResponse();
        res.setId(r.getId());
        res.setCustomerName(r.getCustomerName());
        res.setCustomerPhone(r.getCustomerPhone());
        res.setCustomerEmail(r.getCustomerEmail());
        res.setReservationDate(r.getReservationDate());
        res.setReservationTime(r.getReservationTime());
        res.setNumberOfGuests(r.getNumberOfGuests());
        res.setStatus(r.getStatus());
        res.setNote(r.getNote());
        res.setCreatedAt(r.getCreatedAt());
        res.setUpdatedAt(r.getUpdatedAt());
        if (r.getTable() != null) {
            res.setTableId(r.getTable().getId());
            res.setTableNumber(r.getTable().getTableNumber());
        }
        return res;
    }

    // ── Lấy tất cả (admin) ────────────────────────────────────────
    public List<ReservationResponse> getAllReservations(String status, String date, String search) {
        List<Reservation> list;

        // Tìm kiếm theo tên / SĐT
        if (search != null && !search.isBlank()) {
            list = reservationRepository.searchByNameOrPhone(search.trim());
        }
        // Lọc theo ngày + trạng thái
        else if (date != null && !date.isBlank() && status != null && !status.isBlank()) {
            LocalDate localDate = LocalDate.parse(date);
            list = reservationRepository.findByReservationDateAndStatusOrderByReservationTimeAsc(localDate, status);
        }
        // Lọc theo ngày
        else if (date != null && !date.isBlank()) {
            LocalDate localDate = LocalDate.parse(date);
            list = reservationRepository.findByReservationDateOrderByReservationTimeAsc(localDate);
        }
        // Lọc theo trạng thái
        else if (status != null && !status.isBlank()) {
            list = reservationRepository.findByStatusOrderByReservationDateDescReservationTimeDesc(status);
        }
        // Tất cả
        else {
            list = reservationRepository.findAllByOrderByReservationDateDescReservationTimeDesc();
        }

        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Lấy theo ID ───────────────────────────────────────────────
    public ReservationResponse getById(Long id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt bàn với ID: " + id));
        return toResponse(r);
    }

    // ── Tạo đặt bàn mới (khách hàng – không cần auth) ────────────
    public ReservationResponse createReservation(ReservationRequest request) {
        Reservation r = buildReservation(new Reservation(), request);
        r.setStatus("PENDING");
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        return toResponse(reservationRepository.save(r));
    }

    // ── Cập nhật đặt bàn (admin) ──────────────────────────────────
    public ReservationResponse updateReservation(Long id, ReservationRequest request) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt bàn với ID: " + id));
        buildReservation(r, request);

        // Admin có thể cập nhật trạng thái
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            r.setStatus(request.getStatus());
        }

        r.setUpdatedAt(LocalDateTime.now());
        return toResponse(reservationRepository.save(r));
    }

    // ── Cập nhật nhanh trạng thái ─────────────────────────────────
    public ReservationResponse updateStatus(Long id, ReservationStatusRequest request) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt bàn với ID: " + id));
        r.setStatus(request.getStatus());
        r.setUpdatedAt(LocalDateTime.now());

        // Nếu CONFIRMED, cập nhật bàn sang RESERVED
        if ("CONFIRMED".equals(request.getStatus()) && r.getTable() != null) {
            RestaurantTable table = r.getTable();
            table.setStatus("RESERVED");
            restaurantTableRepository.save(table);
        }

        // Nếu CANCELLED / NO_SHOW / COMPLETED => trả bàn về AVAILABLE
        if (List.of("CANCELLED", "NO_SHOW", "COMPLETED").contains(request.getStatus())
                && r.getTable() != null) {
            RestaurantTable table = r.getTable();
            table.setStatus("AVAILABLE");
            restaurantTableRepository.save(table);
        }

        return toResponse(reservationRepository.save(r));
    }

    // ── Xoá đặt bàn (admin) ───────────────────────────────────────
    public void deleteReservation(Long id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt bàn với ID: " + id));
        // Trả bàn về AVAILABLE nếu đang CONFIRMED/PENDING
        if (r.getTable() != null && List.of("PENDING", "CONFIRMED").contains(r.getStatus())) {
            RestaurantTable table = r.getTable();
            table.setStatus("AVAILABLE");
            restaurantTableRepository.save(table);
        }
        reservationRepository.delete(r);
    }

    // ── Thống kê hôm nay ──────────────────────────────────────────
    public long countTodayReservations() {
        return reservationRepository.countTodayReservations(LocalDate.now());
    }

    // ── Helper: parse + fill entity ───────────────────────────────
    private Reservation buildReservation(Reservation r, ReservationRequest request) {
        r.setCustomerName(request.getCustomerName());
        r.setCustomerPhone(request.getCustomerPhone());
        r.setCustomerEmail(request.getCustomerEmail());
        r.setNumberOfGuests(request.getNumberOfGuests());
        r.setNote(request.getNote());

        // Parse date
        r.setReservationDate(LocalDate.parse(request.getReservationDate()));

        // Parse time (HH:mm hoặc HH:mm:ss)
        String timeStr = request.getReservationTime().trim();
        if (timeStr.length() == 5) {
            r.setReservationTime(LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("HH:mm")));
        } else {
            r.setReservationTime(LocalTime.parse(timeStr));
        }

        // Gán bàn (tuỳ chọn)
        if (request.getTableId() != null) {
            RestaurantTable table = restaurantTableRepository.findById(request.getTableId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với ID: " + request.getTableId()));
            r.setTable(table);
        } else {
            r.setTable(null);
        }

        return r;
    }
}
