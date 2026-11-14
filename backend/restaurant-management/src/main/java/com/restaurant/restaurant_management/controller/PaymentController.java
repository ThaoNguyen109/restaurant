package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    /**
     * POST /api/payment/checkout
     * Xử lý thanh toán Tiền mặt / Chuyển khoản / Cà thẻ và lưu vào bảng payments
     */
    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponse> processCheckout(
            @Valid @RequestBody CashPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.processCheckout(request));
    }

    /**
     * GET /api/payment/order/{orderId}
     * Lấy danh sách các giao dịch thanh toán của một đơn hàng
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByOrder(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }

    /**
     * GET /api/payment
     * Lấy toàn bộ lịch sử thanh toán hóa đơn
     */
    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}
