package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.config.VNPayConfig;
import com.restaurant.restaurant_management.dto.*;
import com.restaurant.restaurant_management.entity.Order;
import com.restaurant.restaurant_management.repository.OrderRepository;
import com.restaurant.restaurant_management.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final VNPayConfig vnPayConfig;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final WebSocketEventService wsEventService;

    /**
     * Tạo URL thanh toán VNPay Sandbox
     */
    public VNPayPaymentResponse createPaymentUrl(VNPayPaymentRequest request, HttpServletRequest httpRequest) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + request.getOrderId()));

        BigDecimal amount = request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? request.getAmount()
                : order.getTotalAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán phải lớn hơn 0");
        }

        // VNPay quy định số tiền nhân 100
        long vnpAmount = amount.multiply(BigDecimal.valueOf(100)).longValue();

        String vnpTxnRef = order.getId() + "_" + System.currentTimeMillis();
        String vnpIpAddr = VNPayUtil.getIpAddress(httpRequest);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime now = LocalDateTime.now(zone);
        String vnpCreateDate = now.format(formatter);
        String vnpExpireDate = now.plusMinutes(15).format(formatter);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnPayConfig.getVersion());
        vnpParams.put("vnp_Command", vnPayConfig.getCommand());
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", request.getOrderInfo() != null && !request.getOrderInfo().isBlank()
                ? request.getOrderInfo().replace("#", "")
                : "Thanh toan don hang " + order.getId());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", vnpIpAddr);
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode());
        }

        // Sắp xếp tham số theo alphabet
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (hashData.length() > 0) {
                    hashData.append("&");
                    query.append("&");
                }
                // Build hash data
                hashData.append(fieldName).append("=").append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                     .append("=")
                     .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
            }
        }

        String queryUrl = query.toString();
        String vnpSecureHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayConfig.getPayUrl() + "?" + queryUrl;

        log.info("Created VNPay payment URL for Order #{}: {}", order.getId(), paymentUrl);

        return VNPayPaymentResponse.builder()
                .status("OK")
                .message("Tạo URL thanh toán thành công")
                .paymentUrl(paymentUrl)
                .orderId(order.getId())
                .amount(amount.longValue())
                .txnRef(vnpTxnRef)
                .build();
    }

    /**
     * Xử lý xác thực phản hồi (Return URL / IPN) từ VNPay
     */
    @Transactional
    public VNPayCallbackResponse handleCallback(Map<String, String> params) {
        log.info("Handling VNPay callback with params: {}", params);

        String vnpSecureHash = params.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key != null && key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                fields.put(key, value);
            }
        }

        String signValue = VNPayUtil.hashAllFields(fields, vnPayConfig.getHashSecret());
        boolean isValidSignature = signValue.equalsIgnoreCase(vnpSecureHash);

        String vnpResponseCode = params.get("vnp_ResponseCode");
        String vnpTxnRef = params.get("vnp_TxnRef");
        String vnpBankCode = params.get("vnp_BankCode");
        String vnpTransactionNo = params.get("vnp_TransactionNo");
        String vnpPayDate = params.get("vnp_PayDate");
        Long amount = params.get("vnp_Amount") != null ? Long.parseLong(params.get("vnp_Amount")) / 100 : 0L;

        Long orderId = null;
        if (vnpTxnRef != null) {
            try {
                orderId = Long.parseLong(vnpTxnRef.split("_")[0]);
            } catch (Exception ignored) {}
        }

        if (!isValidSignature) {
            log.error("VNPay signature verification failed for TxnRef: {}", vnpTxnRef);
            return VNPayCallbackResponse.builder()
                    .success(false)
                    .responseCode(vnpResponseCode)
                    .message("Chữ ký bảo mật không hợp lệ (Invalid SecureHash)")
                    .orderId(orderId)
                    .txnRef(vnpTxnRef)
                    .amount(amount)
                    .build();
        }

        if ("00".equals(vnpResponseCode)) {
            // Thanh toán thành công
            OrderResponse updatedOrder = null;
            if (orderId != null) {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    String paymentNote = "[VNPay #" + vnpTransactionNo + " | " + vnpBankCode + "]";
                    if (order.getNote() == null || order.getNote().isBlank()) {
                        order.setNote("Đã thanh toán qua " + paymentNote);
                    } else if (!order.getNote().contains("VNPay")) {
                        order.setNote(order.getNote() + " - " + paymentNote);
                    }
                    orderRepository.save(order);

                    // Chuyển đơn sang COMPLETED và giải phóng bàn nếu cần
                    updatedOrder = orderService.updateOrderStatus(orderId, new OrderStatusRequest("COMPLETED"));

                    // Gửi thông báo WebSocket
                    wsEventService.sendOrderEvent(
                            "PAYMENT_SUCCESS",
                            "Đơn #" + orderId + " đã được thanh toán thành công qua VNPay!",
                            updatedOrder
                    );
                }
            }

            return VNPayCallbackResponse.builder()
                    .success(true)
                    .responseCode("00")
                    .message("Giao dịch thành công")
                    .orderId(orderId)
                    .txnRef(vnpTxnRef)
                    .amount(amount)
                    .bankCode(vnpBankCode)
                    .transactionNo(vnpTransactionNo)
                    .payDate(vnpPayDate)
                    .order(updatedOrder)
                    .build();
        } else {
            // Giao dịch lỗi hoặc người dùng bấm Hủy
            String errMessage = getVNPayErrorMessage(vnpResponseCode);
            log.warn("VNPay payment failed for order #{}: code={}, msg={}", orderId, vnpResponseCode, errMessage);

            return VNPayCallbackResponse.builder()
                    .success(false)
                    .responseCode(vnpResponseCode)
                    .message(errMessage)
                    .orderId(orderId)
                    .txnRef(vnpTxnRef)
                    .amount(amount)
                    .bankCode(vnpBankCode)
                    .transactionNo(vnpTransactionNo)
                    .payDate(vnpPayDate)
                    .build();
        }
    }

    private String getVNPayErrorMessage(String responseCode) {
        if (responseCode == null) return "Lỗi không xác định";
        return switch (responseCode) {
            case "07" -> "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).";
            case "09" -> "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.";
            case "10" -> "Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.";
            case "11" -> "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.";
            case "12" -> "Thẻ/Tài khoản bị khóa.";
            case "13" -> "Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).";
            case "24" -> "Khách hàng hủy giao dịch.";
            case "51" -> "Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.";
            case "65" -> "Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày.";
            case "75" -> "Ngân hàng thanh toán đang bảo trì.";
            case "79" -> "KH nhập sai mật khẩu thanh toán quá số lần quy định.";
            default -> "Giao dịch không thành công (Mã lỗi: " + responseCode + ")";
        };
    }
}
