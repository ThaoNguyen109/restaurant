package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository
        extends JpaRepository<RestaurantTable, Long> {

    Optional<RestaurantTable> findByTableNumber(Integer tableNumber);

    boolean existsByTableNumber(Integer tableNumber);

    List<RestaurantTable> findByStatus(String status);

    List<RestaurantTable> findByStatusNot(String status);
}