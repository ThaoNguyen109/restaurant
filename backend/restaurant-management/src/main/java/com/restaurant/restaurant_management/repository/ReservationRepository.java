package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** Lấy tất cả theo trạng thái */
    List<Reservation> findByStatusOrderByReservationDateDescReservationTimeDesc(String status);

    /** Lấy tất cả sắp xếp theo ngày & giờ mới nhất */
    List<Reservation> findAllByOrderByReservationDateDescReservationTimeDesc();

    /** Lọc theo ngày đặt bàn */
    List<Reservation> findByReservationDateOrderByReservationTimeAsc(LocalDate date);

    /** Lọc theo ngày + trạng thái */
    List<Reservation> findByReservationDateAndStatusOrderByReservationTimeAsc(LocalDate date, String status);

    /** Tìm các đặt bàn của bàn cụ thể trong một ngày (kiểm tra trùng giờ) */
    @Query("SELECT r FROM Reservation r WHERE r.table.id = :tableId AND r.reservationDate = :date " +
           "AND r.status IN ('PENDING', 'CONFIRMED')")
    List<Reservation> findConflictingReservations(@Param("tableId") Long tableId,
                                                   @Param("date") LocalDate date);

    /** Tìm kiếm theo tên, số điện thoại hoặc email */
    @Query("SELECT r FROM Reservation r WHERE " +
           "LOWER(r.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.customerEmail) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "r.customerPhone LIKE CONCAT('%', :keyword, '%') " +
           "ORDER BY r.reservationDate DESC, r.reservationTime DESC")
    List<Reservation> searchByNameOrPhone(@Param("keyword") String keyword);

    /** Đặt bàn hôm nay */
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.reservationDate = :today " +
           "AND r.status IN ('PENDING', 'CONFIRMED')")
    long countTodayReservations(@Param("today") LocalDate today);
}
