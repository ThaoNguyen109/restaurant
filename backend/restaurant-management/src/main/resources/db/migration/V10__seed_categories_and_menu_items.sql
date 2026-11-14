-- ============================================================
-- V10: Seed dữ liệu danh mục và 10 món ăn
-- ============================================================

-- Danh mục mới (dùng INSERT IGNORE để tránh lỗi trùng lặp nếu đã tồn tại)
INSERT IGNORE INTO categories (name, description, status, created_at, updated_at) VALUES
('Món Khai Vị',    'Các món ăn nhẹ dùng khai vị trước bữa ăn chính',         'ACTIVE', NOW(), NOW()),
('Món Chính',      'Các món ăn chính đậm đà hương vị Việt',                   'ACTIVE', NOW(), NOW()),
('Món Lẩu & Nướng','Các loại lẩu và nướng thơm ngon cho bữa nhậu',           'ACTIVE', NOW(), NOW()),
('Tráng Miệng',    'Các món ngọt và tráng miệng sau bữa ăn',                  'ACTIVE', NOW(), NOW());

-- 10 món ăn (ảnh đã được copy vào uploads/menu-items/)
INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
VALUES
-- Món Khai Vị (category_id lấy từ bảng categories – dùng subquery để tránh hardcode ID)
(
    'Gỏi Cuốn Tôm Thịt',
    'Gỏi cuốn tươi ngon với tôm, thịt heo, rau sống và bún, chấm tương hoisin đậu phộng.',
    'Tôm, thịt heo, bún tươi, rau xà lách, giá đỗ, cà rốt, bánh tráng',
    45000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000003_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Khai Vị'),
    NOW(), NOW()
),
(
    'Bánh Mì Pâté Thịt Nguội',
    'Bánh mì giòn rụm nhân pâté, thịt nguội, chả lụa, dưa leo, hành ngò thơm ngon.',
    'Bánh mì, pâté gan, thịt nguội, chả lụa, dưa leo, hành ngò, tương ớt',
    35000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000004_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Khai Vị'),
    NOW(), NOW()
),
(
    'Chả Giò Rán Giòn',
    'Chả giò vàng giòn nhân thịt heo, miến, nấm mộc nhĩ, cà rốt, chấm nước mắm chua ngọt.',
    'Thịt heo xay, miến, nấm mộc nhĩ, cà rốt, hành tây, trứng, bánh tráng',
    55000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000006_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Khai Vị'),
    NOW(), NOW()
),

-- Món Chính
(
    'Phở Bò Tái Chín',
    'Phở bò truyền thống với nước dùng hầm xương bò ngọt thanh, thịt bò tái và chín mềm.',
    'Bánh phở, xương bò, thịt bò tái, thịt chín, hành tây, gừng, quế, hồi, giá đỗ, rau húng',
    75000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000001_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Chính'),
    NOW(), NOW()
),
(
    'Cơm Tấm Sườn Nướng',
    'Cơm tấm thơm dẻo với sườn heo nướng mật ong đậm vị, kèm bì, chả trứng và mỡ hành.',
    'Gạo tấm, sườn heo, bì, chả hấp, trứng chiên, mỡ hành, nước mắm chua ngọt',
    80000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000002_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Chính'),
    NOW(), NOW()
),
(
    'Bún Bò Huế',
    'Bún bò Huế cay nồng đặc trưng miền Trung với nước dùng hầm sả và mắm ruốc thơm.',
    'Bún tươi, thịt bò, giò heo, chả cua, sả, mắm ruốc, ớt, hành tím',
    75000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000007_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Chính'),
    NOW(), NOW()
),
(
    'Cá Kho Tộ',
    'Cá lóc kho tộ đậm đà với nước mắm, đường thốt nốt, tiêu và ớt, ăn kèm cơm trắng.',
    'Cá lóc, nước mắm, đường thốt nốt, tiêu, ớt, hành tím, gừng, nước dừa',
    90000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000008_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Chính'),
    NOW(), NOW()
),

-- Món Lẩu & Nướng
(
    'Lẩu Hải Sản Thái',
    'Lẩu hải sản chua cay kiểu Thái với tôm, mực, cá, nấm kim châm và rau tươi.',
    'Tôm sú, mực ống, cá, nghêu, nấm kim châm, cà chua, sả, lá chanh, ớt, me',
    320000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000005_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Lẩu & Nướng'),
    NOW(), NOW()
),
(
    'Thịt Nướng Bếp Than BBQ',
    'Thịt heo ba chỉ và cổ heo ướp sả ớt nướng bếp than hồng, chấm mắm nêm sả ớt.',
    'Thịt ba chỉ, cổ heo, sả, tỏi, ớt, mật ong, nước mắm, sa tế',
    180000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000009_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Món Lẩu & Nướng'),
    NOW(), NOW()
),

-- Tráng Miệng
(
    'Chè Ba Màu',
    'Chè ba màu truyền thống với đậu xanh, đậu đỏ, thạch pandan, nước cốt dừa béo ngậy.',
    'Đậu xanh, đậu đỏ, thạch pandan, bột năng, nước cốt dừa, đường, đá bào',
    40000,
    '/uploads/menu-items/a1b2c3d4-0001-4000-a000-000000000010_1794322312209.png',
    'ACTIVE',
    (SELECT id FROM categories WHERE name = 'Tráng Miệng'),
    NOW(), NOW()
);

