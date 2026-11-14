-- ============================================================
-- V12: Tạo bảng payments quản lý giao dịch thanh toán hóa đơn
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    transaction_code VARCHAR(100),
    txn_ref VARCHAR(100),
    bank_code VARCHAR(50),
    cash_given DECIMAL(12, 2),
    change_amount DECIMAL(12, 2),
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    discount_percent INT DEFAULT 0,
    note VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_status ON payments(status);

