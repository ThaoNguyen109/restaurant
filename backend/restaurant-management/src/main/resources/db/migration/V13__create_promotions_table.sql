-- ============================================================
-- V13: Tạo bảng promotions quản lý chương trình khuyến mãi & voucher
-- ============================================================

CREATE TABLE IF NOT EXISTS promotions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT'
    discount_value DECIMAL(12, 2) NOT NULL,
    max_discount DECIMAL(12, 2) NULL,
    min_order_amount DECIMAL(12, 2) NULL DEFAULT 0.00,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_status ON promotions(status);

-- Bổ sung thông tin khuyến mãi vào bảng orders
ALTER TABLE orders 
    ADD COLUMN promotion_id BIGINT NULL,
    ADD COLUMN promotion_code VARCHAR(50) NULL,
    ADD COLUMN discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN final_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- Dữ liệu mẫu khuyến mãi phong phú và thực tế cho nhà hàng Lotus
INSERT INTO promotions (code, title, description, type, discount_value, max_discount, min_order_amount, start_date, end_date, usage_limit, used_count, status)
VALUES 
('LOTUS10', 'Ưu Đãi Khách Mới 10%', 'Giảm 10% tổng hóa đơn (tối đa 50.000đ) cho đơn từ 100.000đ', 'PERCENTAGE', 10.00, 50000.00, 100000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 500, 12, 'ACTIVE'),
('GIAM30K', 'Giảm Ngay 30.000đ', 'Giảm trực tiếp 30.000đ cho đơn hàng ăn uống từ 200.000đ', 'FIXED_AMOUNT', 30000.00, NULL, 200000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 200, 25, 'ACTIVE'),
('VIP20', 'Tri Ân Khách VIP 20%', 'Giảm 20% tổng đơn (tối đa 150.000đ) cho hóa đơn từ 400.000đ', 'PERCENTAGE', 20.00, 150000.00, 400000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 100, 5, 'ACTIVE'),
('TIECVUI50K', 'Bữa Tiệc Rộn Ràng 50K', 'Giảm trực tiếp 50.000đ cho bàn tiệc sum họp từ 500.000đ', 'FIXED_AMOUNT', 50000.00, NULL, 500000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 300, 18, 'ACTIVE');
