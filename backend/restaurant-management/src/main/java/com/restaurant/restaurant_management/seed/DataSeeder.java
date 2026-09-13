package com.restaurant.restaurant_management.seed;

import com.restaurant.restaurant_management.entity.User;
import com.restaurant.restaurant_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed Admin
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

        // Seed Bếp (Chef)
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

        // Seed Phục vụ (Waiter)
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

        // Seed Thu ngân (Cashier)
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
}
