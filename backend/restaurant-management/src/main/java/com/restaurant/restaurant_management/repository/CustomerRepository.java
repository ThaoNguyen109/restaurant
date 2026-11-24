package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByEmail(String email);

    List<Customer> findByTier(String tier);

    List<Customer> findByStatus(String status);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " c.phone LIKE CONCAT('%', :keyword, '%') OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:tier IS NULL OR :tier = '' OR c.tier = :tier) " +
           "AND (:status IS NULL OR :status = '' OR c.status = :status) " +
           "ORDER BY c.createdAt DESC")
    Page<Customer> searchCustomers(
            @Param("keyword") String keyword,
            @Param("tier") String tier,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT c FROM Customer c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " c.phone LIKE CONCAT('%', :keyword, '%') OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:tier IS NULL OR :tier = '' OR c.tier = :tier) " +
           "AND (:status IS NULL OR :status = '' OR c.status = :status) " +
           "ORDER BY c.createdAt DESC")
    List<Customer> searchCustomersAll(
            @Param("keyword") String keyword,
            @Param("tier") String tier,
            @Param("status") String status
    );

    // ── Stats queries ──────────────────────────────────────────────

    long countByTier(String tier);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(c.totalSpent), 0) FROM Customer c")
    java.math.BigDecimal sumTotalSpent();

    @Query("SELECT COALESCE(SUM(c.loyaltyPoints), 0) FROM Customer c")
    Long sumLoyaltyPoints();
}
