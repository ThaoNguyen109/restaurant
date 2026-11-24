-- ============================================================
-- V14: Tạo bảng customers + liên kết orders & reservations
-- ============================================================

CREATE TABLE customers (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  UNIQUE,
    email          VARCHAR(150) UNIQUE,
    birthday       DATE,
    gender         VARCHAR(10),
    address        VARCHAR(255),
    -- Hạng thành viên: BRONZE / SILVER / GOLD / VIP
    tier           VARCHAR(20)  NOT NULL DEFAULT 'BRONZE',
    loyalty_points INT          NOT NULL DEFAULT 0,
    total_spent    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    visit_count    INT          NOT NULL DEFAULT 0,
    note           TEXT,
    -- Trạng thái: ACTIVE / INACTIVE / BLOCKED
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME
);

-- Thêm customer_id vào bảng orders (optional FK)
ALTER TABLE orders
    ADD COLUMN customer_id BIGINT NULL,
    ADD CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Thêm customer_id vào bảng reservations (optional FK)
ALTER TABLE reservations
    ADD COLUMN customer_id BIGINT NULL,
    ADD CONSTRAINT fk_reservations_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ── Dữ liệu mẫu ─────────────────────────────────────────────────
INSERT INTO customers (name, phone, email, birthday, gender, tier, loyalty_points, total_spent, visit_count, status, created_at) VALUES
('Nguyễn Văn An',      '0901234561', 'nguyen.van.an@gmail.com',    '1990-03-15', 'MALE',   'GOLD',   1200, 15000000.00, 42, 'ACTIVE', NOW()),
('Trần Thị Bích',      '0912345672', 'tran.thi.bich@gmail.com',    '1992-07-22', 'FEMALE', 'SILVER', 350,  3500000.00,  18, 'ACTIVE', NOW()),
('Lê Minh Cường',      '0923456783', 'le.minh.cuong@yahoo.com',    '1985-11-08', 'MALE',   'VIP',    5800, 72000000.00, 95, 'ACTIVE', NOW()),
('Phạm Thị Dung',      '0934567894', 'pham.thi.dung@outlook.com',  '1995-01-30', 'FEMALE', 'BRONZE', 80,   800000.00,   4,  'ACTIVE', NOW()),
('Hoàng Văn Em',       '0945678905', 'hoang.van.em@gmail.com',     '1988-06-14', 'MALE',   'GOLD',   2100, 25000000.00, 60, 'ACTIVE', NOW()),
('Vũ Thị Phương',      '0956789016', 'vu.thi.phuong@gmail.com',    '1998-09-05', 'FEMALE', 'SILVER', 480,  4800000.00,  22, 'ACTIVE', NOW()),
('Đặng Quốc Hùng',     '0967890127', 'dang.quoc.hung@gmail.com',   '1991-12-20', 'MALE',   'BRONZE', 150,  1500000.00,  7,  'ACTIVE', NOW()),
('Bùi Thị Lan',        '0978901238', 'bui.thi.lan@gmail.com',      '1993-04-18', 'FEMALE', 'BRONZE', 20,   200000.00,   2,  'INACTIVE', NOW()),
('Ngô Thanh Minh',     '0989012349', 'ngo.thanh.minh@gmail.com',   '1987-08-11', 'MALE',   'SILVER', 620,  6200000.00,  28, 'ACTIVE', NOW()),
('Dương Thị Nga',      '0990123450', 'duong.thi.nga@hotmail.com',  '1996-02-25', 'FEMALE', 'GOLD',   1750, 18500000.00, 50, 'ACTIVE', NOW());
