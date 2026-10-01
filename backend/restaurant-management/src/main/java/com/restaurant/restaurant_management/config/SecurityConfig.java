package com.restaurant.restaurant_management.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.restaurant_management.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth

                // ── Preflight OPTIONS ─────────────────────────────────
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ── Public endpoints ──────────────────────────────────
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/api/email/**").permitAll()

                // Khách hàng xem menu, category, combo (chỉ GET)
                .requestMatchers(HttpMethod.GET,
                        "/api/menu-items", "/api/menu-items/**",
                        "/api/categories", "/api/categories/**",
                        "/api/combos", "/api/combos/**").permitAll()

                // Khách hàng xem bàn (GET) và đặt bàn (POST)
                .requestMatchers(HttpMethod.GET, "/api/tables", "/api/tables/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reservations", "/api/reservations/**").permitAll()

                // ── Menu-items: ADMIN + MANAGER ───────────────────────
                .requestMatchers(HttpMethod.POST, "/api/menu-items/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/menu-items/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/menu-items/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/menu-items/**")
                        .hasAnyRole("ADMIN", "MANAGER")

                // ── Categories: ADMIN + MANAGER ───────────────────────
                .requestMatchers(HttpMethod.POST, "/api/categories/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**")
                        .hasAnyRole("ADMIN", "MANAGER")

                // ── Combos: ADMIN + MANAGER ───────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/combos/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/combos/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/combos/**")
                        .hasAnyRole("ADMIN", "MANAGER")

                // ── Tables: tạo/xóa chỉ ADMIN + MANAGER ─────────────
                .requestMatchers("/api/tables/all")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/tables/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/tables/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/tables/**")
                        .hasAnyRole("ADMIN", "MANAGER")
                // Cập nhật trạng thái bàn: WAITER, STAFF, CHEF, RECEPTIONIST được phép
                .requestMatchers(HttpMethod.PATCH, "/api/tables/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "CHEF", "RECEPTIONIST")

                // ── Reservations ──────────────────────────────────────
                // GET danh sách: ADMIN, MANAGER, WAITER, STAFF, RECEPTIONIST, CASHIER
                .requestMatchers(HttpMethod.GET, "/api/reservations/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "RECEPTIONIST", "CASHIER")
                // PUT, PATCH, DELETE: ADMIN, MANAGER, WAITER, STAFF, RECEPTIONIST, CASHIER
                .requestMatchers(HttpMethod.PUT, "/api/reservations/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "RECEPTIONIST", "CASHIER")
                .requestMatchers(HttpMethod.PATCH, "/api/reservations/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "RECEPTIONIST", "CASHIER")
                .requestMatchers(HttpMethod.DELETE, "/api/reservations/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "RECEPTIONIST", "CASHIER")

                // ── Orders ────────────────────────────────────────────
                // GET orders: tất cả nhân viên đăng nhập
                .requestMatchers(HttpMethod.GET, "/api/orders/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "CASHIER", "KITCHEN", "CHEF")
                // Tạo đơn: ADMIN, MANAGER, WAITER, STAFF
                .requestMatchers(HttpMethod.POST, "/api/orders")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF")
                // Thêm món vào đơn: ADMIN, MANAGER, WAITER, STAFF
                .requestMatchers(HttpMethod.POST, "/api/orders/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF")
                // Cập nhật đơn: ADMIN, MANAGER, WAITER, STAFF
                .requestMatchers(HttpMethod.PUT, "/api/orders/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF")
                // Cập nhật trạng thái đơn: ADMIN, MANAGER, WAITER, CASHIER
                // Cập nhật trạng thái món trong đơn: ADMIN, MANAGER, KITCHEN, CHEF
                .requestMatchers(HttpMethod.PATCH, "/api/orders/**")
                        .hasAnyRole("ADMIN", "MANAGER", "WAITER", "STAFF", "CASHIER", "KITCHEN", "CHEF")
                // Xóa đơn: chỉ ADMIN, MANAGER
                .requestMatchers(HttpMethod.DELETE, "/api/orders/**")
                        .hasAnyRole("ADMIN", "MANAGER")

                // ── Mọi request còn lại phải xác thực ────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Handler khi chưa xác thực (401)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> body = Map.of(
                            "timestamp", LocalDateTime.now().toString(),
                            "status", 401,
                            "error", "UNAUTHORIZED",
                            "message", "Bạn cần đăng nhập để thực hiện thao tác này."
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                })
                // Handler khi không có quyền (403)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> body = Map.of(
                            "timestamp", LocalDateTime.now().toString(),
                            "status", 403,
                            "error", "FORBIDDEN",
                            "message", "Bạn không có quyền thực hiện thao tác này."
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                })
            );

        http.addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
