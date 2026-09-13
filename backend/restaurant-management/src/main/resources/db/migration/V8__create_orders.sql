CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    table_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    note VARCHAR(255) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NULL,

    CONSTRAINT fk_orders_table
        FOREIGN KEY (table_id)
        REFERENCES restaurant_tables(id)
);