package com.restaurant.restaurant_management.seed;

import com.restaurant.restaurant_management.entity.Reservation;
import com.restaurant.restaurant_management.entity.RestaurantTable;
import com.restaurant.restaurant_management.entity.User;
import com.restaurant.restaurant_management.repository.ReservationRepository;
import com.restaurant.restaurant_management.repository.RestaurantTableRepository;
import com.restaurant.restaurant_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedSampleReservations();
    }

    private void seedUsers() {
        // ── 1. Admin ──────────────────────────────────────────────────
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setFullName("Administrator");
            admin.setEmail("admin@restaurant.com");
            admin.setPhone("0123456789");
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
        }

        // ── 2. Lễ tân (Receptionist) ──────────────────────────────────
        if (userRepository.findByUsername("receptionist").isEmpty()) {
            User receptionist = new User();
            receptionist.setUsername("receptionist");
            receptionist.setPassword(passwordEncoder.encode("123456"));
            receptionist.setFullName("Lễ Tân Nhà Hàng");
            receptionist.setEmail("receptionist@restaurant.com");
            receptionist.setPhone("0904111111");
            receptionist.setRole("RECEPTIONIST");
            receptionist.setStatus("ACTIVE");
            receptionist.setCreatedAt(LocalDateTime.now());
            receptionist.setUpdatedAt(LocalDateTime.now());
            userRepository.save(receptionist);
        }

        if (userRepository.findByUsername("letan01").isEmpty()) {
            User receptionist2 = new User();
            receptionist2.setUsername("letan01");
            receptionist2.setPassword(passwordEncoder.encode("123456"));
            receptionist2.setFullName("Nguyễn Thu Trang");
            receptionist2.setEmail("letan01@restaurant.com");
            receptionist2.setPhone("0904222222");
            receptionist2.setRole("RECEPTIONIST");
            receptionist2.setStatus("ACTIVE");
            receptionist2.setCreatedAt(LocalDateTime.now());
            receptionist2.setUpdatedAt(LocalDateTime.now());
            userRepository.save(receptionist2);
        }

        // ── 3. Bếp (Chef) ─────────────────────────────────────────────
        if (userRepository.findByUsername("bep01").isEmpty()) {
            User chef = new User();
            chef.setUsername("bep01");
            chef.setPassword(passwordEncoder.encode("123456"));
            chef.setFullName("Nguyễn Văn Bếp");
            chef.setEmail("bep01@restaurant.com");
            chef.setPhone("0901111111");
            chef.setRole("CHEF");
            chef.setStatus("ACTIVE");
            chef.setCreatedAt(LocalDateTime.now());
            chef.setUpdatedAt(LocalDateTime.now());
            userRepository.save(chef);
        }

        if (userRepository.findByUsername("bep02").isEmpty()) {
            User chef2 = new User();
            chef2.setUsername("bep02");
            chef2.setPassword(passwordEncoder.encode("123456"));
            chef2.setFullName("Trần Thị Hương");
            chef2.setEmail("bep02@restaurant.com");
            chef2.setPhone("0901222222");
            chef2.setRole("CHEF");
            chef2.setStatus("ACTIVE");
            chef2.setCreatedAt(LocalDateTime.now());
            chef2.setUpdatedAt(LocalDateTime.now());
            userRepository.save(chef2);
        }

        // ── 4. Phục vụ (Waiter) ───────────────────────────────────────
        if (userRepository.findByUsername("phucvu01").isEmpty()) {
            User waiter1 = new User();
            waiter1.setUsername("phucvu01");
            waiter1.setPassword(passwordEncoder.encode("123456"));
            waiter1.setFullName("Lê Thị Mai");
            waiter1.setEmail("phucvu01@restaurant.com");
            waiter1.setPhone("0902111111");
            waiter1.setRole("WAITER");
            waiter1.setStatus("ACTIVE");
            waiter1.setCreatedAt(LocalDateTime.now());
            waiter1.setUpdatedAt(LocalDateTime.now());
            userRepository.save(waiter1);
        }

        if (userRepository.findByUsername("phucvu02").isEmpty()) {
            User waiter2 = new User();
            waiter2.setUsername("phucvu02");
            waiter2.setPassword(passwordEncoder.encode("123456"));
            waiter2.setFullName("Phạm Văn Hùng");
            waiter2.setEmail("phucvu02@restaurant.com");
            waiter2.setPhone("0902222222");
            waiter2.setRole("WAITER");
            waiter2.setStatus("ACTIVE");
            waiter2.setCreatedAt(LocalDateTime.now());
            waiter2.setUpdatedAt(LocalDateTime.now());
            userRepository.save(waiter2);
        }

        if (userRepository.findByUsername("phucvu03").isEmpty()) {
            User waiter3 = new User();
            waiter3.setUsername("phucvu03");
            waiter3.setPassword(passwordEncoder.encode("123456"));
            waiter3.setFullName("Hoàng Thị Lan");
            waiter3.setEmail("phucvu03@restaurant.com");
            waiter3.setPhone("0902333333");
            waiter3.setRole("WAITER");
            waiter3.setStatus("ACTIVE");
            waiter3.setCreatedAt(LocalDateTime.now());
            waiter3.setUpdatedAt(LocalDateTime.now());
            userRepository.save(waiter3);
        }

        // ── 5. Thu ngân (Cashier) ─────────────────────────────────────
        if (userRepository.findByUsername("thungan01").isEmpty()) {
            User cashier = new User();
            cashier.setUsername("thungan01");
            cashier.setPassword(passwordEncoder.encode("123456"));
            cashier.setFullName("Võ Thị Thu");
            cashier.setEmail("thungan01@restaurant.com");
            cashier.setPhone("0903111111");
            cashier.setRole("CASHIER");
            cashier.setStatus("ACTIVE");
            cashier.setCreatedAt(LocalDateTime.now());
            cashier.setUpdatedAt(LocalDateTime.now());
            userRepository.save(cashier);
        }
    }

    private void seedSampleReservations() {
        if (reservationRepository.count() > 0) {
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        List<RestaurantTable> tables = restaurantTableRepository.findAll();
        RestaurantTable table1 = tables.size() > 0 ? tables.get(0) : null;
        RestaurantTable table2 = tables.size() > 1 ? tables.get(1) : null;

        // Đơn 1: Hôm nay 18:30 (Đã xác nhận)
        Reservation r1 = new Reservation();
        r1.setCustomerName("Nguyễn Văn Tuấn");
        r1.setCustomerPhone("0901234567");
        r1.setCustomerEmail("tuan.nguyen@gmail.com");
        r1.setReservationDate(today);
        r1.setReservationTime(LocalTime.of(18, 30));
        r1.setNumberOfGuests(4);
        r1.setStatus("CONFIRMED");
        r1.setNote("Khách quen, muốn ngồi gần cửa sổ");
        r1.setTable(table1);
        r1.setCreatedAt(LocalDateTime.now().minusHours(3));
        r1.setUpdatedAt(LocalDateTime.now().minusHours(3));
        reservationRepository.save(r1);

        if (table1 != null) {
            table1.setStatus("RESERVED");
            restaurantTableRepository.save(table1);
        }

        // Đơn 2: Hôm nay 19:00 (Chờ duyệt)
        Reservation r2 = new Reservation();
        r2.setCustomerName("Trần Thị Mai");
        r2.setCustomerPhone("0912345678");
        r2.setCustomerEmail("mai.tran@gmail.com");
        r2.setReservationDate(today);
        r2.setReservationTime(LocalTime.of(19, 0));
        r2.setNumberOfGuests(2);
        r2.setStatus("PENDING");
        r2.setNote("Kỷ niệm ngày cưới, cần không gian yên tĩnh");
        r2.setTable(null);
        r2.setCreatedAt(LocalDateTime.now().minusHours(1));
        r2.setUpdatedAt(LocalDateTime.now().minusHours(1));
        reservationRepository.save(r2);

        // Đơn 3: Hôm nay 11:30 (Khách đã đến / Hoàn thành)
        Reservation r3 = new Reservation();
        r3.setCustomerName("Lê Hoàng Long");
        r3.setCustomerPhone("0987654321");
        r3.setCustomerEmail("long.le@gmail.com");
        r3.setReservationDate(today);
        r3.setReservationTime(LocalTime.of(11, 30));
        r3.setNumberOfGuests(6);
        r3.setStatus("COMPLETED");
        r3.setNote("Ăn trưa công ty");
        r3.setTable(null);
        r3.setCreatedAt(LocalDateTime.now().minusHours(6));
        r3.setUpdatedAt(LocalDateTime.now().minusHours(5));
        reservationRepository.save(r3);

        // Đơn 4: Ngày mai 19:30 (Đã xác nhận)
        Reservation r4 = new Reservation();
        r4.setCustomerName("Phạm Minh Đức");
        r4.setCustomerPhone("0933445566");
        r4.setCustomerEmail("duc.pham@gmail.com");
        r4.setReservationDate(tomorrow);
        r4.setReservationTime(LocalTime.of(19, 30));
        r4.setNumberOfGuests(8);
        r4.setStatus("CONFIRMED");
        r4.setNote("Tiệc sinh nhật, cần chuẩn bị 1 ghế trẻ em");
        r4.setTable(table2);
        r4.setCreatedAt(LocalDateTime.now().minusHours(2));
        r4.setUpdatedAt(LocalDateTime.now().minusHours(2));
        reservationRepository.save(r4);
    }
}
