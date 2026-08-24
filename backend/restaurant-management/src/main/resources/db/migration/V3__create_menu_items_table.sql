CREATE TABLE menu_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    main_ingredients VARCHAR(500),
    price DECIMAL(12,2) NOT NULL,
    image VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    category_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,

    CONSTRAINT fk_menu_item_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
);