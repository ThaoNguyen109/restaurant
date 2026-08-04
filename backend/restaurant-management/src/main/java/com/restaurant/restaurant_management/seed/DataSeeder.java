package com.restaurant.restaurant_management.seed;

import com.restaurant.restaurant_management.entity.User;
import com.restaurant.restaurant_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Optional<User> existing = userRepository.findByUsername("admin");
        if (existing.isEmpty()) {
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
    }
}
