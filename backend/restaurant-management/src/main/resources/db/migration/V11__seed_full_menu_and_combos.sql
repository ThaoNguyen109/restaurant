-- ============================================================
-- V11: Cập nhật seed menu 23 món ăn (chuẩn tên ảnh uploads/) và 5 Combo
-- ============================================================

-- 1. Bổ sung các danh mục mới (INSERT IGNORE)
INSERT IGNORE INTO categories (name, description, status, created_at, updated_at) VALUES
('Món Khai Vị',     'Các món ăn nhẹ khai vị đánh thức vị giác trước bữa ăn chính', 'ACTIVE', NOW(), NOW()),
('Món Chính',       'Các món ăn chính đậm đà bản sắc ẩm thực truyền thống Việt',   'ACTIVE', NOW(), NOW()),
('Món Lẩu & Nướng', 'Các loại lẩu đậm đà và món nướng than hoa thơm lừng',         'ACTIVE', NOW(), NOW()),
('Món Canh & Rau',  'Canh ngọt thanh mát và rau củ xanh tươi xào giòn theo mùa',   'ACTIVE', NOW(), NOW()),
('Đồ Uống',         'Nước ép tươi mát, trà sen và cà phê pha phin truyền thống',   'ACTIVE', NOW(), NOW()),
('Tráng Miệng',     'Chè truyền thống thanh mát và món ngọt sau bữa ăn',            'ACTIVE', NOW(), NOW());

-- 2. Cập nhật các món đã có ảnh trong uploads/ (chuẩn hóa tên, ảnh, mô tả, nguyên liệu)

-- 2.1. Nước cam -> Đồ Uống
UPDATE menu_items 
SET name = 'Nước Cam Vắt Tươi Nguyên Chất',
    description = 'Nước cam sành mọng nước ép nguyên chất 100%, bổ sung vitamin C, vị ngọt thanh mát lành.',
    main_ingredients = 'Cam sành tươi, mật ong hoa nhãn, đá lạnh',
    price = 45000,
    image = '/uploads/menu-items/nuoc-cam.png',
    category_id = (SELECT id FROM categories WHERE name = 'Đồ Uống' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Nước cam%' OR image LIKE '%nuoc-cam%';

-- 2.2. Phở bò -> Món Chính
UPDATE menu_items 
SET name = 'Phở Bò Tái Nạm Cổ Truyền',
    description = 'Bánh phở tươi mềm hòa quyện nước hầm xương bò 12 tiếng ngọt thanh, thịt bò tái mềm thơm nức mũi.',
    main_ingredients = 'Bánh phở tươi, thịt bò tái, nạm bò mềm, xương ống bò, hành hoa, quế, hồi, gừng nướng',
    price = 65000,
    image = '/uploads/menu-items/pho-bo.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Phở bò%' OR image LIKE '%pho-bo%';

-- 2.3. Gỏi Cuốn Tôm Thịt -> Món Khai Vị
UPDATE menu_items 
SET name = 'Gỏi Cuốn Tôm Thịt',
    description = 'Gỏi cuốn thanh mát với tôm sú tươi luộc, thịt ba chỉ, bún và rau ghém tươi, chấm sốt bơ đậu phộng béo ngậy.',
    main_ingredients = 'Tôm sú tươi, thịt ba chỉ, bún tươi, bánh tráng gạo, xà lách, rau thơm, hẹ, sốt tương đậu phộng',
    price = 45000,
    image = '/uploads/menu-items/goi-cuon.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Khai Vị' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Gỏi Cuốn%' OR image LIKE '%goi-cuon%';

-- 2.4. Bánh Mì Pâté Thịt Nguội -> Món Khai Vị
UPDATE menu_items 
SET name = 'Bánh Mì Pâté Thịt Nguội',
    description = 'Bánh mì nướng giòn rụm phết pâté gan béo ngậy, thịt nguội, chả lụa hảo hạng, dưa chuột và đồ chua cay nhẹ.',
    main_ingredients = 'Bánh mì vỏ giòn, pâté gan heo, chả lụa, thịt nguội, dưa leo, ngò rí, đồ chua, sốt ớt',
    price = 35000,
    image = '/uploads/menu-items/banh-mi.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Khai Vị' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Bánh Mì%' OR image LIKE '%banh-mi%';

-- 2.5. Chả Giò Rán Giòn Rụm -> Món Khai Vị
UPDATE menu_items 
SET name = 'Chả Giò Rán Giòn Rụm',
    description = 'Chả giò chiên vàng ươm giòn rụm nhân tôm thịt, mộc nhĩ nấm hương, chấm nước mắm tỏi ớt chua ngọt.',
    main_ingredients = 'Bánh tráng rế, thịt nạc dăm, tôm băm, mộc nhĩ, miến dong, cà rốt, trứng gà, nước mắm tỏi ớt',
    price = 55000,
    image = '/uploads/menu-items/cha-gio.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Khai Vị' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Chả Giò%' OR image LIKE '%cha-gio%';

-- 2.6. Cơm Tấm Sườn Bì Chả -> Món Chính
UPDATE menu_items 
SET name = 'Cơm Tấm Sườn Bì Chả',
    description = 'Cơm tấm hạt dẻo thơm ăn kèm sườn cốt lết ướp mật ong nướng than hoa, chả trứng hấp, bì dai giòn và mỡ hành.',
    main_ingredients = 'Gạo tấm thơm, sườn heo ướp sả mật ong, bì heo sợi, chả trứng thịt, mỡ hành, nước mắm kẹo chua ngọt',
    price = 75000,
    image = '/uploads/menu-items/com-tam.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Cơm Tấm%' OR image LIKE '%com-tam%';

-- 2.7. Bún Bò Huế Cung Đình -> Món Chính
UPDATE menu_items 
SET name = 'Bún Bò Huế Cung Đình',
    description = 'Tô bún bò Huế chuẩn vị cố đô với nước dùng cay nồng hương sả, mắm ruốc, bắp bò hoa và chả cua giòn sần sật.',
    main_ingredients = 'Bún sợi to, bắp bò hoa, nạm bò, chả cua Huế, giò heo, sả cây, mắm ruốc Huế, ớt sa tế, hoa chuối',
    price = 75000,
    image = '/uploads/menu-items/bun-bo.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Bún Bò%' OR image LIKE '%bun-bo%';

-- 2.8. Cá Lóc Kho Tộ Đậm Đà -> Món Chính
UPDATE menu_items 
SET name = 'Cá Lóc Kho Tộ Đậm Đà',
    description = 'Cá lóc đồng tươi kho tộ đất cùng nước mắm cá cơm, kẹo đắng đường thốt nốt, tiêu sọ cay nồng đưa cơm tuyệt hảo.',
    main_ingredients = 'Cá lóc đồng, nước mắm ngon, tiêu sọ đập dập, ớt hiểm, nước màu thốt nốt, hành tím phi, tóp mỡ',
    price = 90000,
    image = '/uploads/menu-items/ca-kho.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Cá Kho%' OR image LIKE '%ca-kho%';

-- 2.9. Lẩu Hải Sản Chua Cay Kiểu Thái -> Món Lẩu & Nướng
UPDATE menu_items 
SET name = 'Lẩu Hải Sản Chua Cay Kiểu Thái',
    description = 'Nồi lẩu đầy đặn tôm sú, mực ống tươi rói, nghêu trắng, nấm kim châm ngập tràn trong nước lẩu tomyum chua cay đậm đà.',
    main_ingredients = 'Tôm sú, mực ống, nghêu biển, nấm kim châm, cà chua, sả, lá chanh, riềng, nước cốt me, ớt xiêm',
    price = 320000,
    image = '/uploads/menu-items/lau-hs.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Lẩu & Nướng' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Lẩu Hải Sản%' OR image LIKE '%lau-hs%';

-- 2.10. Thịt Ba Chỉ Nướng Bếp Than BBQ -> Món Lẩu & Nướng
UPDATE menu_items 
SET name = 'Thịt Ba Chỉ Nướng Bếp Than BBQ',
    description = 'Thịt ba chỉ heo tươi ướp gia vị sốt BBQ bí truyền nướng xèo xèo trên than hồng, ăn kèm xà lách và sốt me cay.',
    main_ingredients = 'Thịt ba chỉ heo tươi, sả băm, tỏi, mật ong hoa nhãn, sốt BBQ, dầu hào, mè rang, xà lách',
    price = 180000,
    image = '/uploads/menu-items/thit-nuong.png',
    category_id = (SELECT id FROM categories WHERE name = 'Món Lẩu & Nướng' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Thịt Nướng%' OR image LIKE '%thit-nuong%';

-- 2.11. Chè Ba Màu Nước Cốt Dừa -> Tráng Miệng
UPDATE menu_items 
SET name = 'Chè Ba Màu Nước Cốt Dừa',
    description = 'Món tráng miệng truyền thống rực rỡ sắc màu gồm đậu đỏ bùi ngọt, đậu xanh nhuyễn mịn, thạch lá dứa và cốt dừa béo ngậy.',
    main_ingredients = 'Đậu đỏ, đậu xanh bóc vỏ, thạch lá dứa, nước cốt dừa tươi, nước đường thốt nốt, đá bào',
    price = 35000,
    image = '/uploads/menu-items/che.png',
    category_id = (SELECT id FROM categories WHERE name = 'Tráng Miệng' LIMIT 1),
    status = 'ACTIVE',
    updated_at = NOW()
WHERE name LIKE '%Chè Ba Màu%' OR image LIKE '%che.png%';

-- 3. Thêm các món ăn mới phong phú để đủ 23 món ăn các loại
-- Dùng INSERT INTO ... SELECT WHERE NOT EXISTS để tránh trùng lặp
INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Nộm Ngó Sen Tôm Thịt',
       'Ngó sen tươi giòn ngọt trộn đều cùng tôm sú, thịt ba chỉ, cà rốt, rau răm và đậu phộng rang thơm phức.',
       'Ngó sen tươi, tôm sú luộc, thịt ba chỉ, cà rốt, rau răm, nước mắm tỏi ớt, đậu phộng rang',
       65000, '/uploads/menu-items/nom-ngo-sen.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Khai Vị' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Nộm Ngó Sen Tôm Thịt');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Bò Lúc Lắc Khoai Tây Chiên',
       'Thịt thăn bò tươi cắt quân cờ xào lửa lớn cùng ớt chuông, hành tây thơm lừng, ăn kèm khoai tây chiên giòn tan.',
       'Thăn bò mềm, ớt chuông tam sắc, hành tây, bơ tỏi, dầu hào, khoai tây cọng chiên giòn',
       135000, '/uploads/menu-items/bo-luc-lac.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bò Lúc Lắc Khoai Tây Chiên');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Gà Nướng Mật Ong Tiêu Rừng',
       'Gà ta thả vườn nướng da vàng óng ánh, thịt mềm ngọt đậm đà phết lớp mật ong rừng và tiêu thơm nồng.',
       'Gà ta thả vườn, mật ong rừng, tiêu xanh, tỏi, nước mắm nhĩ, muối ớt chanh lá é',
       150000, '/uploads/menu-items/ga-nuong.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Gà Nướng Mật Ong Tiêu Rừng');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Mực Ống Xào Sa Tế Cay Nồng',
       'Mực ống tươi dày mình giòn sần sật xào cùng sốt sa tế cay cay, hành tây và cần tây thơm nức.',
       'Mực ống biển tươi, ớt sa tế tôm, hành tây, cần tây, tỏi phi, dầu hào',
       120000, '/uploads/menu-items/muc-xao.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Chính' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Mực Ống Xào Sa Tế Cay Nồng');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Lẩu Gà Lá É Nấm Tươi',
       'Món lẩu đặc sản với nước dùng gà ngọt thanh hầm cùng măng tươi, nấm bào ngư và hương thơm độc đáo của lá é.',
       'Gà ta chặt miếng, lá é tươi, măng tươi, nấm bào ngư, nấm đùi gà, ớt xiêm xanh, bún tươi',
       280000, '/uploads/menu-items/lau-ga.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Lẩu & Nướng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Lẩu Gà Lá É Nấm Tươi');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Sườn Cây Nướng Sốt BBQ',
       'Sườn heo nguyên cây ướp sốt cay ngọt nướng xém cạnh, thịt mềm mọng nước róc xương dễ ăn.',
       'Sườn heo cây, sốt BBQ cay ngọt, tỏi băm, mật ong, tương cà, muối tiêu chanh',
       195000, '/uploads/menu-items/suon-nuong.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Lẩu & Nướng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Sườn Cây Nướng Sốt BBQ');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Canh Chua Cá Nam Bộ',
       'Canh chua chuẩn vị miền Tây với cá tươi, dứa, cà chua, đậu bắp, bạc hà và nước cốt me thanh tao.',
       'Cá lóc khúc, dứa thơm, cà chua, đậu bắp, bạc hà, giá đỗ, nước me chua, ngò om, ngò gai',
       85000, '/uploads/menu-items/canh-chua.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Canh & Rau' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Canh Chua Cá Nam Bộ');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Rau Muống Xào Tỏi Xanh Mướt',
       'Rau muống ngọn non xanh mướt xào lửa to cùng thật nhiều tép tỏi đập dập thơm phức giòn rụm.',
       'Rau muống non, tỏi củ đập dập, dầu ăn, nước mắm nguyên chất, tiêu xay',
       45000, '/uploads/menu-items/rau-xao-toi.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Món Canh & Rau' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Rau Muống Xào Tỏi Xanh Mướt');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Trà Sen Vàng Long Nhãn',
       'Trà ướp hoa sen thượng hạng thanh mát kết hợp hạt sen bùi béo và cùi nhãn ngọt dịu xua tan mệt mỏi.',
       'Trà mạn ướp sen, hạt sen hầm mềm, cùi long nhãn, đường phèn, đá viên',
       40000, '/uploads/menu-items/tra-sen.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Đồ Uống' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Trà Sen Vàng Long Nhãn');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Cà Phê Sữa Đá Sài Gòn',
       'Cà phê Robusta pha phin nguyên chất đậm đà quyện cùng sữa đặc ngọt béo thơm lừng khởi đầu ngày mới.',
       'Cà phê nguyên chất rang mộc, sữa đặc có đường, đá viên tinh khiết',
       35000, '/uploads/menu-items/ca-phe-sua.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Đồ Uống' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cà Phê Sữa Đá Sài Gòn');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Trà Đào Cam Sả Tươi Mát',
       'Sự kết hợp sảng khoái giữa vị thanh dịu của trà đen, cam tươi mọng nước, hương sả nồng ấm và miếng đào giòn ngọt.',
       'Trà đen, đào ngâm giòn, nước cam tươi, sả cây tươi, siro đào, đá lạnh',
       45000, '/uploads/menu-items/tra-dao.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Đồ Uống' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Trà Đào Cam Sả Tươi Mát');

INSERT INTO menu_items (name, description, main_ingredients, price, image, status, category_id, created_at, updated_at)
SELECT 'Chè Hạt Sen Nhãn Nhục Thanh Mát',
       'Chè hạt sen hầm đường phèn thanh tao kết hợp nhãn nhục giòn sần sật, giải nhiệt cơ thể cực kỳ tốt cho sức khỏe.',
       'Hạt sen tươi bóc vỏ, long nhãn nhục, đường phèn thanh khiết, nước hoa bưởi, đá viên',
       40000, '/uploads/menu-items/che-hat-sen.png', 'ACTIVE',
       (SELECT id FROM categories WHERE name = 'Tráng Miệng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chè Hạt Sen Nhãn Nhục Thanh Mát');

-- 4. Bổ sung 5 Combo phong phú
INSERT INTO combos (name, description, price, image, status, created_at, updated_at)
SELECT 'Combo Ăn Sáng Truyền Thống',
       'Bữa sáng tiện lợi chuẩn vị với 1 Phở Bò Tái Nạm thơm nức mũi và 1 Cà Phê Sữa Đá Sài Gòn khởi đầu ngày mới.',
       85000, '/uploads/menu-items/combo-an-sang.png', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Combo Ăn Sáng Truyền Thống');

INSERT INTO combos (name, description, price, image, status, created_at, updated_at)
SELECT 'Combo Cơm Trưa Văn Phòng',
       'Set cơm trưa cân bằng dinh dưỡng gồm 1 Cơm Tấm Sườn Bì Chả nướng mật ong, 1 Chả Giò Rán Giòn Rụm và 1 ly Nước Cam Vắt Tươi.',
       110000, '/uploads/menu-items/combo-com-trua.png', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Combo Cơm Trưa Văn Phòng');

INSERT INTO combos (name, description, price, image, status, created_at, updated_at)
SELECT 'Combo Hẹn Hò Đôi Lãng Mạn (2 người)',
       'Thực đơn ngọt ngào dành cho 2 người gồm 1 Gỏi Cuốn Tôm Thịt khai vị, 1 Bò Lúc Lắc Khoai Tây, 1 Thịt Ba Chỉ Nướng BBQ và 2 ly Trà Sen Vàng.',
       299000, '/uploads/menu-items/combo-hen-ho.png', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Combo Hẹn Hò Đôi Lãng Mạn (2 người)');

INSERT INTO combos (name, description, price, image, status, created_at, updated_at)
SELECT 'Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)',
       'Bữa tiệc liên hoan ấm áp gồm 1 Nồi Lẩu Hải Sản Thái chua cay ngập tràn hải sản, 1 đĩa Nộm Ngó Sen Tôm Thịt giòn mát, 1 đĩa Chả Giò Rán Giòn và 3 ly Nước Cam Vắt Tươi.',
       450000, '/uploads/menu-items/combo-lau-sum-vay.png', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)');

INSERT INTO combos (name, description, price, image, status, created_at, updated_at)
SELECT 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)',
       'Bữa cơm sum họp tròn vị gồm Lẩu Hải Sản Thái, Gà Nướng Mật Ong, Bò Lúc Lắc, Canh Chua Cá, Rau Muống Xào Tỏi và 4 phần Chè Ba Màu tráng miệng.',
       680000, '/uploads/menu-items/combo-dai-tiec.png', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)');

-- 5. Chi tiết món trong từng Combo (combo_items)

-- 5.1. Combo Ăn Sáng Truyền Thống: Phở Bò (x1), Cà Phê Sữa Đá (x1)
INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Ăn Sáng Truyền Thống' 
  AND m.name LIKE '%Phở Bò%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Ăn Sáng Truyền Thống' 
  AND m.name LIKE '%Cà Phê Sữa Đá%';

-- 5.2. Combo Cơm Trưa Văn Phòng: Cơm Tấm (x1), Chả Giò (x1), Nước Cam (x1)
INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Cơm Trưa Văn Phòng' 
  AND m.name LIKE '%Cơm Tấm%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Cơm Trưa Văn Phòng' 
  AND m.name LIKE '%Chả Giò%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Cơm Trưa Văn Phòng' 
  AND m.name LIKE '%Nước Cam%';

-- 5.3. Combo Hẹn Hò Đôi Lãng Mạn: Gỏi Cuốn (x1), Bò Lúc Lắc (x1), Thịt Nướng (x1), Trà Sen (x2)
INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Hẹn Hò Đôi Lãng Mạn (2 người)' 
  AND m.name LIKE '%Gỏi Cuốn%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Hẹn Hò Đôi Lãng Mạn (2 người)' 
  AND m.name LIKE '%Bò Lúc Lắc%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Hẹn Hò Đôi Lãng Mạn (2 người)' 
  AND m.name LIKE '%Thịt Ba Chỉ Nướng%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 2
FROM combos c, menu_items m
WHERE c.name = 'Combo Hẹn Hò Đôi Lãng Mạn (2 người)' 
  AND m.name LIKE '%Trà Sen Vàng%';

-- 5.4. Combo Lẩu Hải Sản Sum Vầy: Lẩu Hải Sản (x1), Nộm Ngó Sen (x1), Chả Giò (x1), Nước Cam (x3)
INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)' 
  AND m.name LIKE '%Lẩu Hải Sản%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)' 
  AND m.name LIKE '%Nộm Ngó Sen%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)' 
  AND m.name LIKE '%Chả Giò%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 3
FROM combos c, menu_items m
WHERE c.name = 'Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)' 
  AND m.name LIKE '%Nước Cam%';

-- 5.5. Combo Đại Tiệc Gia Đình Hoa Sen: Lẩu Hải Sản (x1), Gà Nướng (x1), Bò Lúc Lắc (x1), Canh Chua (x1), Rau Muống (x1), Chè Ba Màu (x4)
INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)' 
  AND m.name LIKE '%Lẩu Hải Sản%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)' 
  AND m.name LIKE '%Gà Nướng%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)' 
  AND m.name LIKE '%Bò Lúc Lắc%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)' 
  AND m.name LIKE '%Canh Chua%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 1
FROM combos c, menu_items m
WHERE c.name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)' 
  AND m.name LIKE '%Rau Muống Xào%';

INSERT IGNORE INTO combo_items (combo_id, menu_item_id, quantity)
SELECT c.id, m.id, 4
FROM combos c, menu_items m
WHERE c.name = 'Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)' 
  AND m.name LIKE '%Chè Ba Màu%';

