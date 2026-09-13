CREATE TABLE combo_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    combo_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,

    quantity INT NOT NULL DEFAULT 1,

    CONSTRAINT fk_combo_items_combo
        FOREIGN KEY (combo_id)
        REFERENCES combos(id),

    CONSTRAINT fk_combo_items_menu_item
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id),

    CONSTRAINT uq_combo_menu_item
        UNIQUE (combo_id, menu_item_id)
);