package com.restaurant.restaurant_management.repository;

import com.restaurant.restaurant_management.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    List<OrderItem> findByStatus(String status);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId AND oi.id = :itemId")
    OrderItem findByOrderIdAndItemId(@Param("orderId") Long orderId, @Param("itemId") Long itemId);
}
