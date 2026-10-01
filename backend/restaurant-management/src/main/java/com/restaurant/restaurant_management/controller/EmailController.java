package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * API gửi email test
     * Ví dụ request body:
     * {
     *   "to": "test@gmail.com",
     *   "subject": "Tiêu đề test",
     *   "content": "Nội dung email test"
     * }
     */
    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String subject = request.getOrDefault("subject", "Test Email từ Restaurant Management");
        String content = request.getOrDefault("content", "Xin chào! Đây là email thử nghiệm từ hệ thống quản lý nhà hàng.");

        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp địa chỉ email nhận (to)"));
        }

        emailService.sendSimpleEmail(to, subject, content);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Yêu cầu gửi email đã được tiếp nhận và xử lý ngầm (async) tới: " + to
        ));
    }

    /**
     * API gửi test email xác nhận đặt bàn (HTML template)
     */
    @PostMapping("/test-reservation-html")
    public ResponseEntity<?> sendTestReservationHtml(@RequestParam String to) {
        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp tham số 'to'"));
        }

        emailService.sendReservationConfirmation(
                to,
                "Nguyễn Văn A",
                "Bàn 05",
                "2026-10-01",
                "19:00",
                4
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã gửi email HTML test đặt bàn tới: " + to
        ));
    }
}
