CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT NOT NULL,

    menu_item_id BIGINT NULL,

    combo_id BIGINT NULL,

    quantity INT NOT NULL DEFAULT 1,

    unit_price DECIMAL(12,2) NOT NULL,

    subtotal DECIMAL(12,2) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    note VARCHAR(255) NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_order_items_menu_item
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id),

    CONSTRAINT fk_order_items_combo
        FOREIGN KEY (combo_id)
        REFERENCES combos(id),

    CONSTRAINT chk_order_item_product
        CHECK (
            (menu_item_id IS NOT NULL AND combo_id IS NULL)
            OR
            (menu_item_id IS NULL AND combo_id IS NOT NULL)
        )
);