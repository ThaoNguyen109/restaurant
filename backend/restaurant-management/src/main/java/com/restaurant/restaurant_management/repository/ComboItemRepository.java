package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.ComboItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComboItemRepository extends JpaRepository<ComboItem, Long> {

    List<ComboItem> findByComboId(Long comboId);

    Optional<ComboItem> findByComboIdAndMenuItemId(Long comboId, Long menuItemId);

    void deleteByComboId(Long comboId);

    void deleteByComboIdAndMenuItemId(Long comboId, Long menuItemId);
}
