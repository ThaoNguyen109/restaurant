package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.RestaurantTableRequest;
import com.restaurant.restaurant_management.entity.RestaurantTable;
import com.restaurant.restaurant_management.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;

    public RestaurantTableService(RestaurantTableRepository restaurantTableRepository) {
        this.restaurantTableRepository = restaurantTableRepository;
    }

    // Lấy tất cả bàn
    public List<RestaurantTable> getAllTables() {
        return restaurantTableRepository.findAll();
    }

    // Lấy bàn theo ID
    public RestaurantTable getTableById(Long id) {
        return restaurantTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với ID: " + id));
    }

    // Thêm bàn
    public RestaurantTable createTable(RestaurantTableRequest request) {

        // Kiểm tra số bàn đã tồn tại
        if (restaurantTableRepository.existsByTableNumber(request.getTableNumber())) {
            throw new RuntimeException(
                    "Bàn số " + request.getTableNumber() + " đã tồn tại"
            );
        }

        RestaurantTable table = new RestaurantTable();

        table.setTableNumber(request.getTableNumber());
        table.setCapacity(request.getCapacity());

        // Nếu không truyền status thì mặc định AVAILABLE
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            table.setStatus("AVAILABLE");
        } else {
            table.setStatus(request.getStatus());
        }

        table.setCreatedAt(LocalDateTime.now());
        table.setUpdatedAt(LocalDateTime.now());

        return restaurantTableRepository.save(table);
    }

    // Cập nhật bàn
    public RestaurantTable updateTable(Long id, RestaurantTableRequest request) {

        RestaurantTable table = getTableById(id);

        // Kiểm tra số bàn mới có bị trùng với bàn khác không
        if (!table.getTableNumber().equals(request.getTableNumber())
                && restaurantTableRepository.existsByTableNumber(request.getTableNumber())) {

            throw new RuntimeException(
                    "Bàn số " + request.getTableNumber() + " đã tồn tại"
            );
        }

        table.setTableNumber(request.getTableNumber());
        table.setCapacity(request.getCapacity());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            table.setStatus(request.getStatus());
        }

        table.setUpdatedAt(LocalDateTime.now());

        return restaurantTableRepository.save(table);
    }

    // Xóa mềm
    public void deleteTable(Long id) {

        RestaurantTable table = getTableById(id);

        table.setStatus("INACTIVE");
        table.setUpdatedAt(LocalDateTime.now());

        restaurantTableRepository.save(table);
    }

    // Lấy các bàn đang hoạt động
    public List<RestaurantTable> getActiveTables() {
    return restaurantTableRepository.findByStatusNot("INACTIVE");
}
}