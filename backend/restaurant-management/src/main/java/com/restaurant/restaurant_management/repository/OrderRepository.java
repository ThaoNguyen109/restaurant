package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Lấy tất cả sắp xếp theo thời gian tạo mới nhất */
    List<Order> findAllByOrderByCreatedAtDesc();

    /** Lấy theo trạng thái */
    List<Order> findByStatusOrderByCreatedAtDesc(String status);

    /** Lấy đơn hàng theo bàn */
    List<Order> findByTableIdOrderByCreatedAtDesc(Long tableId);

    /** Tìm đơn hàng đang hoạt động (chưa hoàn thành/chưa hủy) của một bàn */
    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY o.createdAt DESC")
    List<Order> findActiveOrdersByTableId(@Param("tableId") Long tableId);

    /** Lọc đa tiêu chí: status, tableId, khoảng thời gian (ngày), từ khóa tìm kiếm (bàn, ghi chú, mã đơn) */
    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:tableId IS NULL OR o.table.id = :tableId) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate) AND " +
           "(:keyword IS NULL OR " +
           " CONCAT('', o.id) LIKE CONCAT('%', :keyword, '%') OR " +
           " CONCAT('', o.table.tableNumber) LIKE CONCAT('%', :keyword, '%') OR " +
           " LOWER(o.note) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY o.createdAt DESC")
    List<Order> filterOrders(
            @Param("status") String status,
            @Param("tableId") Long tableId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("keyword") String keyword
    );

    /** Đếm đơn tạo trong khoảng thời gian */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    long countOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Đếm đơn theo trạng thái */
    long countByStatus(String status);

    /** Đếm đơn theo trạng thái trong khoảng thời gian */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt <= :end")
    long countByStatusAndCreatedAtBetween(
            @Param("status") String status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /** Tính doanh thu các đơn COMPLETED trong khoảng thời gian */
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
