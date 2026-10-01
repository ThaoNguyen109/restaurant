package com.restaurant.restaurant_management.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── Gửi email text đơn giản (bất đồng bộ) ─────────────────────
    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("[EMAIL] Plain text gửi thành công tới {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] Lỗi gửi plain text tới {}: {}", to, e.getMessage());
        }
    }

    // ── Gửi email HTML (KHÔNG @Async – gọi từ nội bộ) ─────────────
    // Lưu ý: KHÔNG đặt @Async ở đây vì Spring AOP không proxy self-invocation.
    // Các method bên ngoài đã được đánh @Async nên thread vẫn là async.
    private void doSendHtml(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("[EMAIL] HTML gửi thành công tới {} | Chủ đề: {}", to, subject);
        } catch (MessagingException e) {
            log.error("[EMAIL] Lỗi tạo MimeMessage tới {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("[EMAIL] Lỗi không xác định khi gửi tới {}: {}", to, e.getMessage(), e);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // 1. Email khi khách đặt bàn thành công → trạng thái PENDING
    //    Tất cả tham số là primitive/String → không phụ thuộc JPA session
    // ────────────────────────────────────────────────────────────────
    @Async
    public void sendReservationPending(String toEmail, String customerName,
                                       String tableNumber, String date, String time, int guests) {
        log.info("[EMAIL] Chuẩn bị gửi mail PENDING tới {} ({})", customerName, toEmail);
        String subject = "🍽️ Đặt bàn thành công – Đang chờ xác nhận";
        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;
                        border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;color:#333;">
              <div style="background:linear-gradient(135deg,#ff6b35,#f7c59f);
                          padding:32px 24px;text-align:center;">
                <h1 style="margin:0;font-size:26px;color:#fff;letter-spacing:1px;">🍽️ Nhà Hàng</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                  Cảm ơn quý khách đã tin tưởng lựa chọn!</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <p style="font-size:16px;">Kính gửi <strong>%s</strong>,</p>
                <p style="color:#555;line-height:1.7;">
                  Chúng tôi đã nhận được yêu cầu đặt bàn của quý khách. Đơn đặt bàn hiện đang ở trạng thái
                  <span style="display:inline-block;background:#fff3cd;color:#856404;
                               border-radius:20px;padding:2px 12px;font-weight:600;font-size:13px;">
                    ⏳ Chờ xác nhận
                  </span>
                </p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;font-size:15px;">
                  <tr style="background:#fafafa;">
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;width:40%%;">📅 Ngày đặt</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%s</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;">🕐 Thời gian</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%s</td>
                  </tr>
                  <tr style="background:#fafafa;">
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;">👥 Số khách</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%d người</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;">🪑 Bàn số</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%s</td>
                  </tr>
                </table>
                <div style="background:#fff8f0;border-left:4px solid #ff6b35;
                            border-radius:6px;padding:14px 18px;margin:20px 0;">
                  <p style="margin:0;color:#c84b00;font-size:14px;">
                    📌 Quý khách vui lòng chờ email xác nhận từ chúng tôi trong thời gian sớm nhất.
                    Nếu cần hỗ trợ, vui lòng liên hệ hotline nhà hàng.
                  </p>
                </div>
                <p style="color:#555;">Hân hạnh được đón tiếp quý khách! 🙏</p>
              </div>
              <div style="background:#f5f5f5;text-align:center;padding:14px;
                          font-size:12px;color:#999;">
                Email này được gửi tự động từ hệ thống quản lý nhà hàng. Vui lòng không trả lời.
              </div>
            </div>
            """.formatted(
                customerName != null ? customerName : "Quý khách",
                date != null ? date : "N/A",
                time != null ? time : "N/A",
                guests,
                tableNumber != null ? tableNumber : "Sẽ được sắp xếp khi đến"
        );
        doSendHtml(toEmail, subject, html);
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Email khi admin XÁC NHẬN → trạng thái CONFIRMED
    // ────────────────────────────────────────────────────────────────
    @Async
    public void sendReservationConfirmed(String toEmail, String customerName,
                                         String tableNumber, String date, String time, int guests) {
        log.info("[EMAIL] Chuẩn bị gửi mail CONFIRMED tới {} ({})", customerName, toEmail);
        String subject = "✅ Đặt bàn đã được xác nhận – Hẹn gặp quý khách!";
        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;
                        border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;color:#333;">
              <div style="background:linear-gradient(135deg,#11998e,#38ef7d);
                          padding:32px 24px;text-align:center;">
                <h1 style="margin:0;font-size:26px;color:#fff;letter-spacing:1px;">🍽️ Nhà Hàng</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                  Đặt bàn của quý khách đã được xác nhận!</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <p style="font-size:16px;">Kính gửi <strong>%s</strong>,</p>
                <p style="color:#555;line-height:1.7;">
                  Chúng tôi vui mừng thông báo đơn đặt bàn của quý khách đã được
                  <span style="display:inline-block;background:#d4edda;color:#155724;
                               border-radius:20px;padding:2px 12px;font-weight:600;font-size:13px;">
                    ✅ Xác nhận thành công
                  </span>
                </p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;font-size:15px;">
                  <tr style="background:#fafafa;">
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;width:40%%;">📅 Ngày đặt</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%s</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;">🕐 Thời gian</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%s</td>
                  </tr>
                  <tr style="background:#fafafa;">
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;">👥 Số khách</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%d người</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 14px;border:1px solid #eee;color:#777;">🪑 Bàn số</td>
                    <td style="padding:12px 14px;border:1px solid #eee;font-weight:600;">%s</td>
                  </tr>
                </table>
                <div style="background:#f0fff4;border-left:4px solid #28a745;
                            border-radius:6px;padding:14px 18px;margin:20px 0;">
                  <p style="margin:0;color:#155724;font-size:14px;">
                    🎉 Chúng tôi rất mong được đón tiếp quý khách. Vui lòng có mặt đúng giờ đã đặt.
                    Nếu cần thay đổi hoặc huỷ bàn, vui lòng liên hệ hotline sớm nhất có thể.
                  </p>
                </div>
                <p style="color:#555;">Hẹn gặp lại quý khách! 🙏</p>
              </div>
              <div style="background:#f5f5f5;text-align:center;padding:14px;
                          font-size:12px;color:#999;">
                Email này được gửi tự động từ hệ thống quản lý nhà hàng. Vui lòng không trả lời.
              </div>
            </div>
            """.formatted(
                customerName != null ? customerName : "Quý khách",
                date != null ? date : "N/A",
                time != null ? time : "N/A",
                guests,
                tableNumber != null ? tableNumber : "Sẽ được sắp xếp khi đến"
        );
        doSendHtml(toEmail, subject, html);
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Email khi admin TỪ CHỐI → trạng thái CANCELLED
    // ────────────────────────────────────────────────────────────────
    @Async
    public void sendReservationCancelled(String toEmail, String customerName,
                                          String date, String time) {
        log.info("[EMAIL] Chuẩn bị gửi mail CANCELLED tới {} ({})", customerName, toEmail);
        String subject = "❌ Thông báo: Đặt bàn không thể thực hiện";
        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;
                        border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;color:#333;">
              <div style="background:linear-gradient(135deg,#c0392b,#e74c3c);
                          padding:32px 24px;text-align:center;">
                <h1 style="margin:0;font-size:26px;color:#fff;letter-spacing:1px;">🍽️ Nhà Hàng</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                  Thông báo về đặt bàn của quý khách</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <p style="font-size:16px;">Kính gửi <strong>%s</strong>,</p>
                <p style="color:#555;line-height:1.7;">
                  Chúng tôi rất tiếc phải thông báo rằng đơn đặt bàn của quý khách vào lúc
                  <strong>%s</strong> ngày <strong>%s</strong> đã bị
                  <span style="display:inline-block;background:#f8d7da;color:#721c24;
                               border-radius:20px;padding:2px 12px;font-weight:600;font-size:13px;">
                    ❌ Từ chối
                  </span>
                </p>
                <div style="background:#fff5f5;border-left:4px solid #e74c3c;
                            border-radius:6px;padding:14px 18px;margin:20px 0;">
                  <p style="margin:0;color:#721c24;font-size:14px;">
                    😔 Điều này có thể xảy ra do nhà hàng hết chỗ hoặc không thể phục vụ vào khung giờ đã chọn.
                    Chúng tôi xin lỗi vì sự bất tiện này.
                  </p>
                </div>
                <p style="color:#555;line-height:1.7;">
                  Quý khách có thể thử đặt bàn vào khung giờ khác hoặc liên hệ trực tiếp hotline
                  để được hỗ trợ tốt nhất.
                </p>
                <p style="color:#555;">Trân trọng cảm ơn và mong được phục vụ quý khách trong dịp khác! 🙏</p>
              </div>
              <div style="background:#f5f5f5;text-align:center;padding:14px;
                          font-size:12px;color:#999;">
                Email này được gửi tự động từ hệ thống quản lý nhà hàng. Vui lòng không trả lời.
              </div>
            </div>
            """.formatted(
                customerName != null ? customerName : "Quý khách",
                time != null ? time : "N/A",
                date != null ? date : "N/A"
        );
        doSendHtml(toEmail, subject, html);
    }

    // Backward-compat alias → gọi sendReservationPending
    @Async
    public void sendReservationConfirmation(String toEmail, String customerName, String tableNumber,
                                            String date, String time, int guests) {
        sendReservationPending(toEmail, customerName, tableNumber, date, time, guests);
    }
}
