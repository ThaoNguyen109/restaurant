package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<Payment> findByTxnRef(String txnRef);

    List<Payment> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    List<Payment> findByPaymentMethodOrderByCreatedAtDesc(String paymentMethod);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS' AND p.createdAt >= :start AND p.createdAt <= :end")
    BigDecimal sumAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS' AND p.paymentMethod = :method AND p.createdAt >= :start AND p.createdAt <= :end")
    BigDecimal sumAmountByMethodBetween(@Param("method") String method, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}

