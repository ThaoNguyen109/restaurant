CREATE TABLE restaurant_tables (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    capacity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);