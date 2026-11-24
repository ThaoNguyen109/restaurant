package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.CustomerRequest;
import com.restaurant.restaurant_management.dto.CustomerResponse;
import com.restaurant.restaurant_management.dto.CustomerStatsResponse;
import com.restaurant.restaurant_management.service.CustomerService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /**
     * Danh sách khách hàng phân trang & tìm kiếm
     */
    @GetMapping
    public ResponseEntity<Page<CustomerResponse>> getCustomers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<CustomerResponse> result = customerService.searchCustomers(keyword, tier, status, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy toàn bộ danh sách khách hàng không phân trang
     */
    @GetMapping("/all")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) String status
    ) {
        List<CustomerResponse> list = (keyword != null || tier != null || status != null)
                ? customerService.searchCustomersAll(keyword, tier, status)
                : customerService.getAllCustomers();
        return ResponseEntity.ok(list);
    }

    /**
     * Thống kê tổng quan khách hàng
     */
    @GetMapping("/stats")
    public ResponseEntity<CustomerStatsResponse> getStats() {
        return ResponseEntity.ok(customerService.getStats());
    }

    /**
     * Tra cứu theo số điện thoại (cho thu ngân / phục vụ)
     */
    @GetMapping("/phone/{phone}")
    public ResponseEntity<CustomerResponse> getByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(customerService.findByPhone(phone));
    }

    /**
     * Xem chi tiết khách hàng và lịch sử đơn hàng
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomer(id));
    }

    /**
     * Tạo khách hàng mới
     */
    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@RequestBody CustomerRequest request) {
        CustomerResponse created = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Cập nhật thông tin khách hàng
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerRequest request
    ) {
        CustomerResponse updated = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Xóa khách hàng
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa khách hàng thành công"));
    }

    /**
     * Tích điểm thủ công hoặc theo giá trị đơn hàng
     */
    @PostMapping("/{id}/points")
    public ResponseEntity<Map<String, Object>> addPoints(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        Object amountObj = body.get("amount");
        BigDecimal amount = amountObj != null ? new BigDecimal(amountObj.toString()) : BigDecimal.ZERO;
        customerService.addLoyaltyPoints(id, amount);
        return ResponseEntity.ok(Map.of(
                "message", "Đã cộng điểm tích lũy thành công",
                "customerId", id
        ));
    }
}
