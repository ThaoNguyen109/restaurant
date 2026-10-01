package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.ReservationRequest;
import com.restaurant.restaurant_management.dto.ReservationResponse;
import com.restaurant.restaurant_management.dto.ReservationStatusRequest;
import com.restaurant.restaurant_management.entity.Reservation;
import com.restaurant.restaurant_management.entity.RestaurantTable;
import com.restaurant.restaurant_management.repository.ReservationRepository;
import com.restaurant.restaurant_management.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final EmailService emailService;
    private final WebSocketEventService wsEventService;

    public ReservationService(ReservationRepository reservationRepository,
                              RestaurantTableRepository restaurantTableRepository,
                              EmailService emailService,
                              WebSocketEventService wsEventService) {
        this.reservationRepository = reservationRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.emailService = emailService;
        this.wsEventService = wsEventService;
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
        String initialStatus = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus() : "PENDING";
        r.setStatus(initialStatus);
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        Reservation saved = reservationRepository.save(r);
        log.info("[RESERVATION] Đã lưu đặt bàn #{} cho {} ({} khách)",
                saved.getId(), saved.getCustomerName(), saved.getNumberOfGuests());

        // Nếu tạo đơn với trạng thái CONFIRMED và có bàn -> cập nhật bàn sang RESERVED
        if ("CONFIRMED".equals(initialStatus) && saved.getTable() != null) {
            RestaurantTable table = saved.getTable();
            table.setStatus("RESERVED");
            restaurantTableRepository.save(table);
        }

        // ★ GỬI WEBSOCKET EVENT NGAY (TRƯỚC email) để frontend nhận realtime ★
        ReservationResponse resp = toResponse(saved);
        try {
            wsEventService.sendReservationEvent("RESERVATION_CREATED",
                    "Khách " + saved.getCustomerName() + " vừa đặt bàn (" + saved.getNumberOfGuests() + " khách) lúc " + saved.getReservationTime(),
                    resp);
            log.info("[RESERVATION] ✓ Đã gửi WebSocket event RESERVATION_CREATED cho đặt bàn #{}", saved.getId());
        } catch (Exception wsEx) {
            log.error("[RESERVATION] ✗ Lỗi gửi WebSocket event: {}", wsEx.getMessage(), wsEx);
        }

        // Gửi email (sau WS event, bọc try-catch để không ảnh hưởng response)
        try {
            String email    = saved.getCustomerEmail();
            String name     = saved.getCustomerName();
            String tableStr = (saved.getTable() != null && saved.getTable().getTableNumber() != null)
                    ? String.valueOf(saved.getTable().getTableNumber()) : null;
            String date     = saved.getReservationDate()  != null ? saved.getReservationDate().toString()  : "";
            String time     = saved.getReservationTime()  != null ? saved.getReservationTime().toString()  : "";
            int    guests   = saved.getNumberOfGuests()   != null ? saved.getNumberOfGuests()              : 1;

            if (email != null && !email.isBlank()) {
                if ("CONFIRMED".equals(initialStatus)) {
                    emailService.sendReservationConfirmed(email, name, tableStr, date, time, guests);
                } else {
                    emailService.sendReservationPending(email, name, tableStr, date, time, guests);
                }
                log.info("[RESERVATION] Đã gọi gửi email tới {}", email);
            }
        } catch (Exception emailEx) {
            log.error("[RESERVATION] ✗ Lỗi gửi email (không ảnh hưởng đặt bàn): {}", emailEx.getMessage());
        }

        return resp;
    }

    // ── Cập nhật đặt bàn (admin / staff) ──────────────────────────
    public ReservationResponse updateReservation(Long id, ReservationRequest request) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt bàn với ID: " + id));

        String oldStatus = r.getStatus();
        RestaurantTable oldTable = r.getTable();

        buildReservation(r, request);

        // Có thể cập nhật trạng thái
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            r.setStatus(request.getStatus());
        }

        String newStatus = r.getStatus();
        RestaurantTable newTable = r.getTable();

        // Đồng bộ trạng thái bàn nếu bàn cũ thay đổi
        if (oldTable != null && (newTable == null || !oldTable.getId().equals(newTable.getId()))) {
            if (List.of("PENDING", "CONFIRMED").contains(oldStatus)) {
                oldTable.setStatus("AVAILABLE");
                restaurantTableRepository.save(oldTable);
            }
        }
        if (newTable != null) {
            if ("CONFIRMED".equals(newStatus)) {
                newTable.setStatus("RESERVED");
                restaurantTableRepository.save(newTable);
            } else if (List.of("CANCELLED", "COMPLETED", "NO_SHOW").contains(newStatus)) {
                newTable.setStatus("AVAILABLE");
                restaurantTableRepository.save(newTable);
            }
        }

        r.setUpdatedAt(LocalDateTime.now());
        Reservation updated = reservationRepository.save(r);
        ReservationResponse resp = toResponse(updated);
        wsEventService.sendReservationEvent("RESERVATION_UPDATED",
                "Đơn đặt bàn của " + updated.getCustomerName() + " đã được cập nhật",
                resp);
        return resp;
    }

    // ── Cập nhật nhanh trạng thái ─────────────────────────────────
    public ReservationResponse updateStatus(Long id, ReservationStatusRequest request) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt bàn với ID: " + id));

        String newStatus = request.getStatus();
        r.setStatus(newStatus);
        r.setUpdatedAt(LocalDateTime.now());

        // Trích xuất toàn bộ dữ liệu cần thiết TRƯỚC khi gọi @Async
        // (JPA session đóng sau transaction; lazy-load trên async thread sẽ fail)
        String email    = r.getCustomerEmail();
        String name     = r.getCustomerName();
        String tableStr = (r.getTable() != null && r.getTable().getTableNumber() != null)
                ? String.valueOf(r.getTable().getTableNumber()) : null;
        String date     = r.getReservationDate() != null ? r.getReservationDate().toString() : "";
        String time     = r.getReservationTime() != null ? r.getReservationTime().toString() : "";
        int    guests   = r.getNumberOfGuests()  != null ? r.getNumberOfGuests()             : 1;

        // Nếu CONFIRMED → cập nhật bàn sang RESERVED + gửi mail xác nhận
        if ("CONFIRMED".equals(newStatus)) {
            if (r.getTable() != null) {
                RestaurantTable table = r.getTable();
                table.setStatus("RESERVED");
                restaurantTableRepository.save(table);
            }
            if (email != null && !email.isBlank()) {
                emailService.sendReservationConfirmed(email, name, tableStr, date, time, guests);
            }
        }

        // Nếu CANCELLED → trả bàn về AVAILABLE + gửi mail từ chối
        if ("CANCELLED".equals(newStatus)) {
            if (r.getTable() != null) {
                RestaurantTable table = r.getTable();
                table.setStatus("AVAILABLE");
                restaurantTableRepository.save(table);
            }
            if (email != null && !email.isBlank()) {
                emailService.sendReservationCancelled(email, name, date, time);
            }
        }

        // Nếu NO_SHOW / COMPLETED => trả bàn về AVAILABLE (không gửi mail)
        if (List.of("NO_SHOW", "COMPLETED").contains(newStatus) && r.getTable() != null) {
            RestaurantTable table = r.getTable();
            table.setStatus("AVAILABLE");
            restaurantTableRepository.save(table);
        }

        Reservation updated = reservationRepository.save(r);
        ReservationResponse resp = toResponse(updated);
        wsEventService.sendReservationEvent("RESERVATION_STATUS_CHANGED",
                "Đơn đặt bàn của " + updated.getCustomerName() + " chuyển sang " + newStatus,
                resp);
        return resp;
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
        wsEventService.sendReservationEvent("RESERVATION_DELETED",
                "Đơn đặt bàn #" + id + " của " + r.getCustomerName() + " đã được xóa",
                toResponse(r));
    }

    // ── Gửi event thử nghiệm (để kiểm tra chuông realtime từ server) ──
    public void sendTestNotification() {
        ReservationResponse mock = new ReservationResponse();
        mock.setId(999L);
        mock.setCustomerName("Nguyễn Khách Thử");
        mock.setCustomerPhone("0901234567");
        mock.setNumberOfGuests(4);
        mock.setReservationDate(LocalDate.now());
        mock.setReservationTime(LocalTime.now());
        mock.setStatus("PENDING");
        mock.setNote("Đơn kiểm tra chuông realtime từ máy chủ");
        wsEventService.sendReservationEvent("RESERVATION_CREATED",
                "Khách Nguyễn Khách Thử vừa đặt bàn (4 khách) [TEST]",
                mock);
    }

    // ── Thống kê hôm nay ──────────────────────────────────────────
    public long countTodayReservations() {
        return reservationRepository.countTodayReservations(LocalDate.now());
    }

    // ── Helper: parse + fill entity ───────────────────────────────
    private Reservation buildReservation(Reservation r, ReservationRequest request) {
        r.setCustomerName(request.getCustomerName() != null ? request.getCustomerName().trim() : "");
        r.setCustomerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : "");
        r.setCustomerEmail(request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()
                ? request.getCustomerEmail().trim() : null);
        r.setNumberOfGuests(request.getNumberOfGuests());
        r.setNote(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null);

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
