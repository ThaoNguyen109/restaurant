package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.AuthRequest;
import com.restaurant.restaurant_management.dto.AuthResponse;
import com.restaurant.restaurant_management.entity.User;
import com.restaurant.restaurant_management.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void loginShouldReturnTokenWhenCredentialsValid() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        JwtService jwtService = new JwtService();
        AuthService authService = new AuthService(userRepository, passwordEncoder, jwtService);

        User user = new User();
        user.setId(1L);
        user.setUsername("admin");
        user.setPassword(passwordEncoder.encode("123456"));
        user.setRole("ADMIN");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(new AuthRequest("admin", "123456"));

        assertNotNull(response.getToken());
        assertEquals("admin", response.getUsername());
        assertEquals("ADMIN", response.getRole());
    }
}
