package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByCategoryId(Long categoryId);

    List<MenuItem> findByStatus(String status);

    List<MenuItem> findByCategoryIdAndStatus(Long categoryId, String status);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    @Query("SELECT m FROM MenuItem m WHERE " +
           "(:categoryId IS NULL OR m.categoryId = :categoryId) AND " +
           "(:status IS NULL OR m.status = :status) AND " +
           "(:search IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<MenuItem> searchMenuItems(@Param("categoryId") Long categoryId,
                                   @Param("status") String status,
                                   @Param("search") String search);
}
