package com.restaurant.restaurant_management.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.restaurant_management.dto.ChatMessageDto;
import com.restaurant.restaurant_management.dto.ChatRequest;
import com.restaurant.restaurant_management.dto.ChatResponse;
import com.restaurant.restaurant_management.entity.Category;
import com.restaurant.restaurant_management.entity.Combo;
import com.restaurant.restaurant_management.entity.MenuItem;
import com.restaurant.restaurant_management.entity.Promotion;
import com.restaurant.restaurant_management.entity.PromotionType;
import com.restaurant.restaurant_management.repository.CategoryRepository;
import com.restaurant.restaurant_management.repository.ComboRepository;
import com.restaurant.restaurant_management.repository.MenuItemRepository;
import com.restaurant.restaurant_management.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final ComboRepository comboRepository;
    private final PromotionRepository promotionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiUrl;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String modelName;

    private final RestClient restClient = RestClient.builder().build();

    /**
     * Xử lý yêu cầu trò chuyện từ khách hàng
     */
    public ChatResponse chat(ChatRequest request) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMessage.isEmpty()) {
            return ChatResponse.builder()
                    .reply("Dạ, quý khách cần em hỗ trợ tư vấn món gì hay đặt bàn ạ?")
                    .build();
        }

        // Kiểm tra xem đã có API Key chưa
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            log.warn("Gemini API key chưa được cấu hình. Sử dụng fallback thông minh từ cơ sở dữ liệu.");
            return generateLocalFallback(userMessage);
        }

        try {
            return callGeminiApi(request);
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API: {}", e.getMessage(), e);
            // Fallback khi có lỗi mạng / API
            return generateLocalFallback(userMessage);
        }
    }

    /**
     * Gọi Gemini API với System Context cập nhật trực tiếp từ Database
     */
    private ChatResponse callGeminiApi(ChatRequest request) {
        String systemInstruction = buildSystemPrompt();

        // Xây dựng request body cho Gemini
        Map<String, Object> body = new HashMap<>();

        // System Instruction
        Map<String, Object> systemPart = Map.of("text", systemInstruction);
        body.put("system_instruction", Map.of("parts", List.of(systemPart)));

        // History + Current Message
        List<Map<String, Object>> contents = new ArrayList<>();

        if (request.getHistory() != null) {
            // Giới hạn 10 tin nhắn gần nhất để tối ưu token
            int start = Math.max(0, request.getHistory().size() - 10);
            for (int i = start; i < request.getHistory().size(); i++) {
                ChatMessageDto msg = request.getHistory().get(i);
                if (msg.getText() != null && !msg.getText().isBlank()) {
                    String role = "user".equalsIgnoreCase(msg.getRole()) ? "user" : "model";
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", msg.getText()))
                    ));
                }
            }
        }

        // Thêm câu hỏi hiện tại của khách
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.getMessage()))
        ));
        body.put("contents", contents);

        // Generation Config
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("maxOutputTokens", 1000);
        body.put("generationConfig", genConfig);

        String fullUrl = String.format("%s/%s:generateContent?key=%s", apiUrl, modelName, apiKey);

        String rawResponse = restClient.post()
                .uri(fullUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        String replyText = parseGeminiResponse(rawResponse);

        // Tự động phân tích xem có nên gắn kèm nút hành động (Xem menu, Đặt bàn)
        ActionSuggestion action = determineAction(request.getMessage(), replyText);

        return ChatResponse.builder()
                .reply(replyText)
                .actionText(action.actionText)
                .actionUrl(action.actionUrl)
                .build();
    }

    /**
     * Trích xuất văn bản trả lời từ JSON response của Gemini
     */
    private String parseGeminiResponse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText();
                }
            }
        } catch (Exception e) {
            log.error("Lỗi parse phản hồi từ Gemini: {}", e.getMessage());
        }
        return "Dạ Hoa Sen rất sẵn lòng phục vụ quý khách! Quý khách có thể xem thực đơn chi tiết hoặc đặt bàn ngay bên dưới ạ.";
    }

    /**
     * Tạo System Prompt với dữ liệu món ăn, giá và danh mục thực tế từ Database
     */
    private String buildSystemPrompt() {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là 'Trợ lý Hoa Sen 🌸' - nhân viên tư vấn ảo của Nhà hàng Hoa Sen.\n");
        sb.append("Phong cách: Thân thiện, niềm nở, hiếu khách, xưng hô 'Em' hoặc 'Hoa Sen' và gọi khách là 'Quý khách'.\n");
        sb.append("Thông tin nhà hàng:\n");
        sb.append("- Địa chỉ: Trung tâm TP. Hồ Chí Minh\n");
        sb.append("- Hotline: (028) 3822 1234\n");
        sb.append("- Giờ mở cửa: 10:00 - 22:30 mỗi ngày (cả Thứ 7, Chủ nhật và Lễ Tết)\n");
        sb.append("- Ưu đãi: Tặng món tráng miệng cho bàn từ 4 khách; Giảm 10% dịp sinh nhật khi đặt trước.\n");
        sb.append("- Đặt bàn: Khách có thể đặt trực tuyến ngay trên website hoặc gọi Hotline.\n\n");

        sb.append("DANH SÁCH MÓN ĂN THỰC TẾ TRONG NHÀ HÀNG (Dữ liệu thời gian thực):\n");
        Locale vnLocale = new Locale("vi", "VN");
        NumberFormat currencyFormat = NumberFormat.getInstance(vnLocale);

        Map<Long, String> categoryMap = new HashMap<>();
        try {
            List<Category> categories = categoryRepository.findAll();
            for (Category c : categories) {
                categoryMap.put(c.getId(), c.getName());
            }
        } catch (Exception ignored) {}

        try {
            List<MenuItem> menuItems = menuItemRepository.findAll();
            for (MenuItem item : menuItems) {
                String catName = categoryMap.getOrDefault(item.getCategoryId(), "Món khác");
                String priceStr = item.getPrice() != null ? currencyFormat.format(item.getPrice()) + "đ" : "Liên hệ";
                String statusStr = "AVAILABLE".equalsIgnoreCase(item.getStatus()) ? "Còn hàng" : "Hết hàng";

                sb.append(String.format("- [%s] %s: %s (Trạng thái: %s).", catName, item.getName(), priceStr, statusStr));
                if (item.getMainIngredients() != null && !item.getMainIngredients().isBlank()) {
                    sb.append(" Nguyên liệu: ").append(item.getMainIngredients()).append(".");
                }
                if (item.getDescription() != null && !item.getDescription().isBlank()) {
                    sb.append(" Mô tả: ").append(item.getDescription());
                }
                sb.append("\n");
            }
        } catch (Exception e) {
            sb.append("- Đang cập nhật thêm thực đơn...\n");
        }

        try {
            List<Combo> combos = comboRepository.findAll();
            if (!combos.isEmpty()) {
                sb.append("\nDANH SÁCH COMBO ƯU ĐÃI:\n");
                for (Combo combo : combos) {
                    String comboPrice = combo.getPrice() != null ? currencyFormat.format(combo.getPrice()) + "đ" : "";
                    sb.append(String.format("- Combo '%s': %s. Mô tả: %s\n",
                            combo.getName(), comboPrice, combo.getDescription() != null ? combo.getDescription() : ""));
                }
            }
        } catch (Exception ignored) {}

        try {
            List<Promotion> promotions = promotionRepository.findByStatus("ACTIVE");
            if (promotions != null && !promotions.isEmpty()) {
                sb.append("\nDANH SÁCH MÃ KHUYẾN MÃI & VOUCHER ĐANG HOẠT ĐỘNG (Áp dụng khi đặt món hoặc thanh toán):\n");
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Promotion p : promotions) {
                    String valStr = p.getType() == PromotionType.PERCENTAGE
                            ? p.getDiscountValue().stripTrailingZeros().toPlainString() + "%"
                            : currencyFormat.format(p.getDiscountValue()) + "đ";
                    String maxDiscStr = (p.getMaxDiscount() != null && p.getMaxDiscount().doubleValue() > 0)
                            ? " (Tối đa " + currencyFormat.format(p.getMaxDiscount()) + "đ)"
                            : "";
                    String minOrderStr = (p.getMinOrderAmount() != null && p.getMinOrderAmount().doubleValue() > 0)
                            ? " cho đơn từ " + currencyFormat.format(p.getMinOrderAmount()) + "đ"
                            : " cho mọi đơn hàng";
                    String expStr = p.getEndDate() != null ? p.getEndDate().format(dtf) : "Vô thời hạn";

                    sb.append(String.format("- Mã voucher: **%s** | Tiêu đề: '%s' | Giảm: %s%s%s | Hạn dùng: %s. Mô tả: %s\n",
                            p.getCode(), p.getTitle(), valStr, maxDiscStr, minOrderStr, expStr,
                            p.getDescription() != null ? p.getDescription() : ""));
                }
            }
        } catch (Exception ignored) {}

        sb.append("\nQUY TẮC PHỤC VỤ:\n");
        sb.append("1. Trả lời tự nhiên, khéo léo, tư vấn tận tâm. Khi gợi ý món, hãy **in đậm tên món** và kèm giá tiền để khách dễ theo dõi.\n");
        sb.append("2. Khi khách hỏi về KHUYẾN MÃI, VOUCHER, MÃ GIẢM GIÁ, ƯU ĐÃI: hãy niềm nở giới thiệu các mã voucher đang hoạt động ở trên, ghi rõ **Mã voucher**, mức giảm, điều kiện đơn tối thiểu và hướng dẫn khách nhập mã tại bước gọi món online hoặc cung cấp cho thu ngân khi thanh toán.\n");
        sb.append("3. Nếu khách hỏi món chay, đồ cay, món cho trẻ em, tiệc gia đình,... hãy chọn lọc trong thực đơn trên để tư vấn phù hợp nhất.\n");
        sb.append("4. Nếu món hết hàng, hãy thông báo lịch sự và giới thiệu món tương tự.\n");
        sb.append("5. Giữ câu trả lời súc tích, định dạng gạch đầu dòng rõ ràng, không viết văn quá dài dòng.\n");
        sb.append("6. Chỉ tư vấn về ẩm thực và dịch vụ nhà hàng. Nếu khách hỏi nội dung không liên quan, hãy khéo léo từ chối và mời trải nghiệm món ngon của Hoa Sen.");

        return sb.toString();
    }

    /**
     * Fallback thông minh khi chưa có API key hoặc lỗi mạng
     */
    private ChatResponse generateLocalFallback(String message) {
        String lower = message.toLowerCase();

        // 1. Hỏi về chương trình khuyến mãi / mã giảm giá / voucher
        if (lower.contains("khuyến mãi") || lower.contains("khuyen mai") ||
            lower.contains("voucher") || lower.contains("mã giảm") || lower.contains("ma giam") ||
            lower.contains("giảm giá") || lower.contains("giam gia") || lower.contains("ưu đãi") ||
            lower.contains("uu dai") || lower.contains("discount") || lower.contains("tiết kiệm")) {

            try {
                List<Promotion> promotions = promotionRepository.findByStatus("ACTIVE");
                if (promotions != null && !promotions.isEmpty()) {
                    StringBuilder promoReply = new StringBuilder("Dạ, Nhà hàng Hoa Sen đang có các chương trình khuyến mãi & mã voucher cực kỳ hấp dẫn dành cho quý khách ạ! 🌸\n\n");
                    Locale vnLocale = new Locale("vi", "VN");
                    NumberFormat cf = NumberFormat.getInstance(vnLocale);
                    DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                    for (Promotion p : promotions) {
                        String valStr = p.getType() == PromotionType.PERCENTAGE
                                ? p.getDiscountValue().stripTrailingZeros().toPlainString() + "%"
                                : cf.format(p.getDiscountValue()) + "đ";
                        String maxDiscStr = (p.getMaxDiscount() != null && p.getMaxDiscount().doubleValue() > 0)
                                ? " (tối đa " + cf.format(p.getMaxDiscount()) + "đ)"
                                : "";
                        String minOrderStr = (p.getMinOrderAmount() != null && p.getMinOrderAmount().doubleValue() > 0)
                                ? " cho đơn từ " + cf.format(p.getMinOrderAmount()) + "đ"
                                : " cho mọi đơn";

                        promoReply.append("🎁 Mã **").append(p.getCode()).append("**: ")
                                .append(p.getTitle()).append(" — Giảm **").append(valStr).append("**")
                                .append(maxDiscStr).append(minOrderStr);

                        if (p.getDescription() != null && !p.getDescription().isBlank()) {
                            promoReply.append(" (").append(p.getDescription()).append(")");
                        }
                        if (p.getEndDate() != null) {
                            promoReply.append(" • HSD: ").append(p.getEndDate().format(dtf));
                        }
                        promoReply.append("\n");
                    }

                    promoReply.append("\n👉 Quý khách có thể nhập mã voucher này tại bước Đặt món online hoặc cung cấp cho nhân viên thu ngân khi thanh toán nhé! 🪷");

                    return ChatResponse.builder()
                            .reply(promoReply.toString())
                            .actionText("Đặt món & Dùng mã voucher")
                            .actionUrl("/order")
                            .build();
                }
            } catch (Exception e) {
                log.error("Lỗi lấy danh sách khuyến mãi cho chatbot fallback: {}", e.getMessage());
            }

            return ChatResponse.builder()
                    .reply("Dạ, nhà hàng Hoa Sen thường xuyên có các ưu đãi giảm 10% - 20% cho khách hàng thân thiết, tặng món tráng miệng cho bàn từ 4 người và ưu đãi sinh nhật. Quý khách có thể theo dõi mã voucher trực tiếp khi gọi món online ạ! 🌸")
                    .actionText("Đặt món trực tuyến")
                    .actionUrl("/order")
                    .build();
        }

        if (lower.contains("đặt bàn") || lower.contains("giữ chỗ") || lower.contains("booking") || lower.contains("bàn")) {
            return ChatResponse.builder()
                    .reply("Quý khách có thể đặt bàn trực tuyến rất nhanh tại mục **Đặt bàn ngay** hoặc liên hệ Hotline: **(028) 3822 1234**. Nhà hàng Hoa Sen hân hạnh đón tiếp quý khách ạ! 🌸")
                    .actionText("Đặt bàn ngay bây giờ")
                    .actionUrl("/customer#reservation")
                    .build();
        }

        if (lower.contains("giờ") || lower.contains("mở cửa") || lower.contains("đóng cửa") || lower.contains("thời gian")) {
            return ChatResponse.builder()
                    .reply("Nhà hàng Hoa Sen mở cửa phục vụ từ **10:00 sáng đến 22:30 tối** tất cả các ngày trong tuần (kể cả Thứ 7, Chủ nhật và Lễ Tết) ạ! 🕒")
                    .build();
        }

        if (lower.contains("chay") || lower.contains("rau") || lower.contains("thanh đạm")) {
            return ChatResponse.builder()
                    .reply("Hoa Sen có các món thanh đạm, rau củ và nấm tươi hữu cơ hảo hạng. Quý khách có thể xem mục thực đơn chi tiết để chọn món ưng ý nhé! 🥗")
                    .actionText("Xem thực đơn")
                    .actionUrl("/customer/menu")
                    .build();
        }

        // Lấy thử một vài món ăn nổi bật từ DB để giới thiệu
        try {
            List<MenuItem> items = menuItemRepository.findByStatus("AVAILABLE");
            if (items != null && !items.isEmpty()) {
                StringBuilder menuIntro = new StringBuilder("Dạ, một số món đặc sắc được yêu thích tại Hoa Sen:\n");
                Locale vnLocale = new Locale("vi", "VN");
                NumberFormat cf = NumberFormat.getInstance(vnLocale);
                int count = 0;
                for (MenuItem item : items) {
                    menuIntro.append("• **").append(item.getName()).append("**: ")
                            .append(cf.format(item.getPrice())).append("đ\n");
                    count++;
                    if (count >= 4) break;
                }
                menuIntro.append("Quý khách có thể xem toàn bộ thực đơn kèm hình ảnh và giá chi tiết tại trang Thực đơn ạ! 🌸");
                return ChatResponse.builder()
                        .reply(menuIntro.toString())
                        .actionText("Xem toàn bộ thực đơn")
                        .actionUrl("/customer/menu")
                        .build();
            }
        } catch (Exception ignored) {}

        return ChatResponse.builder()
                .reply("Dạ em là Trợ lý Hoa Sen 🌸. Em rất sẵn lòng hỗ trợ quý khách tư vấn các món ngon, chương trình khuyến mãi voucher hoặc hướng dẫn đặt bàn trước ạ!")
                .actionText("Xem thực đơn")
                .actionUrl("/customer/menu")
                .build();
    }

    /**
     * Xác định nút điều hướng tương tác kèm theo câu trả lời
     */
    private ActionSuggestion determineAction(String userMsg, String reply) {
        String combined = (userMsg + " " + reply).toLowerCase();
        if (combined.contains("khuyến mãi") || combined.contains("voucher") || combined.contains("mã giảm") || combined.contains("ưu đãi")) {
            return new ActionSuggestion("Đặt món & Dùng mã voucher", "/order");
        }
        if (combined.contains("đặt bàn") || combined.contains("đặt chỗ") || combined.contains("giữ chỗ")) {
            return new ActionSuggestion("Đặt bàn ngay bây giờ", "/customer#reservation");
        }
        if (combined.contains("món") || combined.contains("thực đơn") || combined.contains("menu") || combined.contains("combo")) {
            return new ActionSuggestion("Xem toàn bộ thực đơn", "/customer/menu");
        }
        return new ActionSuggestion(null, null);
    }

    private static class ActionSuggestion {
        final String actionText;
        final String actionUrl;
        ActionSuggestion(String actionText, String actionUrl) {
            this.actionText = actionText;
            this.actionUrl = actionUrl;
        }
    }
}
