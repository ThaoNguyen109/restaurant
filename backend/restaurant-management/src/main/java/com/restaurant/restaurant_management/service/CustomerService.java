package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.entity.Customer;
import com.restaurant.restaurant_management.entity.Order;
import com.restaurant.restaurant_management.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    public CustomerService(CustomerRepository customerRepository,
                           OrderRepository orderRepository) {
        this.customerRepository = customerRepository;
        this.orderRepository    = orderRepository;
    }

    // ── CRUD ───────────────────────────────────────────────────────

    public CustomerResponse createCustomer(CustomerRequest req) {
        // Kiểm tra trùng SĐT
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            customerRepository.findByPhone(req.getPhone()).ifPresent(c -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Số điện thoại đã tồn tại: " + req.getPhone());
            });
        }
        // Kiểm tra trùng email
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            customerRepository.findByEmail(req.getEmail()).ifPresent(c -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Email đã tồn tại: " + req.getEmail());
            });
        }

        Customer customer = new Customer();
        mapRequestToEntity(req, customer);
        customer.recalculateTier();
        Customer saved = customerRepository.save(customer);
        return CustomerResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomer(Long id) {
        Customer c = findById(id);
        CustomerResponse resp = CustomerResponse.from(c);
        // Lấy 10 đơn gần nhất
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId(), PageRequest.of(0, 10));
        resp.setRecentOrders(orders.stream().map(this::toOrderSummary).collect(Collectors.toList()));
        resp.setTotalOrders((long) orderRepository.countByCustomerId(c.getId()));
        return resp;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(CustomerResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> searchCustomers(String keyword, String tier, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return customerRepository.searchCustomers(keyword, tier, status, pageable)
                .map(CustomerResponse::from);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> searchCustomersAll(String keyword, String tier, String status) {
        return customerRepository.searchCustomersAll(keyword, tier, status)
                .stream().map(CustomerResponse::from).collect(Collectors.toList());
    }

    public CustomerResponse updateCustomer(Long id, CustomerRequest req) {
        Customer customer = findById(id);

        // Kiểm tra trùng SĐT (ngoại trừ chính khách hàng này)
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            customerRepository.findByPhone(req.getPhone()).ifPresent(c -> {
                if (!c.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Số điện thoại đã tồn tại: " + req.getPhone());
                }
            });
        }
        // Kiểm tra trùng email
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            customerRepository.findByEmail(req.getEmail()).ifPresent(c -> {
                if (!c.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Email đã tồn tại: " + req.getEmail());
                }
            });
        }

        mapRequestToEntity(req, customer);
        // Nếu admin override tier (VIP chẳng hạn) thì giữ tier đó, không recalculate
        if (req.getTier() != null && !req.getTier().isBlank()) {
            customer.setTier(req.getTier());
        } else {
            customer.recalculateTier();
        }
        return CustomerResponse.from(customerRepository.save(customer));
    }

    public void deleteCustomer(Long id) {
        Customer customer = findById(id);
        // Tách liên kết orders (đặt customer_id = null) trước khi xóa
        orderRepository.clearCustomerIdByCustomerId(customer.getId());
        customerRepository.delete(customer);
    }

    // ── Tra cứu theo SĐT (dùng cho cashier / staff) ───────────────

    @Transactional(readOnly = true)
    public CustomerResponse findByPhone(String phone) {
        Customer c = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy khách hàng với SĐT: " + phone));
        return CustomerResponse.from(c);
    }

    // ── Stats ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CustomerStatsResponse getStats() {
        CustomerStatsResponse stats = new CustomerStatsResponse();
        stats.setTotalCustomers(customerRepository.count());
        stats.setBronzeCount(customerRepository.countByTier("BRONZE"));
        stats.setSilverCount(customerRepository.countByTier("SILVER"));
        stats.setGoldCount(customerRepository.countByTier("GOLD"));
        stats.setVipCount(customerRepository.countByTier("VIP"));
        stats.setActiveCount(customerRepository.countByStatus("ACTIVE"));
        stats.setInactiveCount(customerRepository.countByStatus("INACTIVE") + customerRepository.countByStatus("BLOCKED"));
        BigDecimal revenue = customerRepository.sumTotalSpent();
        stats.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);
        Long points = customerRepository.sumLoyaltyPoints();
        stats.setTotalLoyaltyPoints(points != null ? points : 0L);
        return stats;
    }

    // ── Thêm điểm tích lũy & cập nhật tổng chi tiêu ──────────────

    public void addLoyaltyPoints(Long customerId, BigDecimal orderAmount) {
        customerRepository.findById(customerId).ifPresent(c -> {
            // 1 điểm mỗi 10,000đ
            int pointsEarned = orderAmount.divide(new BigDecimal("10000"), 0, java.math.RoundingMode.FLOOR).intValue();
            c.setLoyaltyPoints(c.getLoyaltyPoints() + pointsEarned);
            c.setTotalSpent(c.getTotalSpent().add(orderAmount));
            c.setVisitCount(c.getVisitCount() + 1);
            c.recalculateTier();
            customerRepository.save(c);
        });
    }

    // ── Private helpers ────────────────────────────────────────────

    private Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy khách hàng #" + id));
    }

    private void mapRequestToEntity(CustomerRequest req, Customer c) {
        if (req.getName() != null)         c.setName(req.getName());
        if (req.getPhone() != null)        c.setPhone(req.getPhone().isBlank() ? null : req.getPhone());
        if (req.getEmail() != null)        c.setEmail(req.getEmail().isBlank() ? null : req.getEmail());
        if (req.getBirthday() != null)     c.setBirthday(req.getBirthday());
        if (req.getGender() != null)       c.setGender(req.getGender());
        if (req.getAddress() != null)      c.setAddress(req.getAddress());
        if (req.getNote() != null)         c.setNote(req.getNote());
        if (req.getStatus() != null)       c.setStatus(req.getStatus());
        if (req.getLoyaltyPoints() != null) c.setLoyaltyPoints(req.getLoyaltyPoints());
    }

    private CustomerResponse.CustomerOrderSummary toOrderSummary(Order o) {
        CustomerResponse.CustomerOrderSummary s = new CustomerResponse.CustomerOrderSummary();
        s.setOrderId(o.getId());
        s.setTableNumber(o.getTable() != null ? String.valueOf(o.getTable().getTableNumber()) : "?");
        s.setFinalAmount(o.getFinalAmount());
        s.setStatus(o.getStatus());
        s.setCreatedAt(o.getCreatedAt());
        return s;
    }
}
