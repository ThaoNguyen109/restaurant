package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.VNPayCallbackResponse;
import com.restaurant.restaurant_management.dto.VNPayPaymentRequest;
import com.restaurant.restaurant_management.dto.VNPayPaymentResponse;
import com.restaurant.restaurant_management.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * POST /api/payment/vnpay/create
     * Tạo URL thanh toán VNPay Sandbox cho một đơn hàng
     */
    @PostMapping("/vnpay/create")
    public ResponseEntity<VNPayPaymentResponse> createPaymentUrl(
            @Valid @RequestBody VNPayPaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(paymentService.createPaymentUrl(request, httpRequest));
    }

    /**
     * GET /api/payment/vnpay/callback
     * Nhận phản hồi thanh toán từ VNPay (Return URL hoặc IPN Webhook)
     */
    @GetMapping("/vnpay/callback")
    public ResponseEntity<VNPayCallbackResponse> handleCallback(
            @RequestParam Map<String, String> queryParams
    ) {
        return ResponseEntity.ok(paymentService.handleCallback(queryParams));
    }
}
