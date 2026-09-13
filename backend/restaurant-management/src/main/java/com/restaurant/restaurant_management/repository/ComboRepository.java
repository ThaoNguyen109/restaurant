package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.Combo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComboRepository extends JpaRepository<Combo, Long> {

    Optional<Combo> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);   // Thêm dòng này

    List<Combo> findByStatus(String status);

    List<Combo> findByStatusNot(String status);
}