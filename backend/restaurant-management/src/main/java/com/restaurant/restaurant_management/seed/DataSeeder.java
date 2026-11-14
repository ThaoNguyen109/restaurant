package com.restaurant.restaurant_management.seed;

import com.restaurant.restaurant_management.entity.*;
import com.restaurant.restaurant_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final ReservationRepository reservationRepository;
    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final ComboRepository comboRepository;
    private final ComboItemRepository comboItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCategoriesAndMenuItems();
        seedCombos();
        seedUsers();
        seedSampleReservations();
    }

    private void seedCategoriesAndMenuItems() {
        Category catKhaiVi = getOrCreateCategory("Món Khai Vị", "Các món ăn nhẹ khai vị đánh thức vị giác trước bữa ăn chính");
        Category catChinh = getOrCreateCategory("Món Chính", "Các món ăn chính đậm đà bản sắc ẩm thực truyền thống Việt");
        Category catLauNuong = getOrCreateCategory("Món Lẩu & Nướng", "Các loại lẩu đậm đà và món nướng than hoa thơm lừng");
        Category catCanhRau = getOrCreateCategory("Món Canh & Rau", "Canh ngọt thanh mát và rau củ xanh tươi xào giòn theo mùa");
        Category catDoUong = getOrCreateCategory("Đồ Uống", "Nước ép tươi mát, trà sen và cà phê pha phin truyền thống");
        Category catTrangMieng = getOrCreateCategory("Tráng Miệng", "Chè truyền thống thanh mát và món ngọt sau bữa ăn");

        // 1. Danh sách 11 món đã có ảnh trong uploads/menu-items/
        upsertMenuItem(
            "Nước Cam Vắt Tươi Nguyên Chất",
            "Nước cam sành mọng nước ép nguyên chất 100%, bổ sung vitamin C, vị ngọt thanh mát lành.",
            "Cam sành tươi, mật ong hoa nhãn, đá lạnh",
            new BigDecimal("45000"),
            "/uploads/menu-items/nuoc-cam.png",
            catDoUong.getId()
        );

        upsertMenuItem(
            "Phở Bò Tái Nạm Cổ Truyền",
            "Bánh phở tươi mềm hòa quyện nước hầm xương bò 12 tiếng ngọt thanh, thịt bò tái mềm thơm nức mũi.",
            "Bánh phở tươi, thịt bò tái, nạm bò mềm, xương ống bò, hành hoa, quế, hồi, gừng nướng",
            new BigDecimal("65000"),
            "/uploads/menu-items/pho-bo.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Gỏi Cuốn Tôm Thịt",
            "Gỏi cuốn thanh mát với tôm sú tươi luộc, thịt ba chỉ, bún và rau ghém tươi, chấm sốt bơ đậu phộng béo ngậy.",
            "Tôm sú tươi, thịt ba chỉ, bún tươi, bánh tráng gạo, xà lách, rau thơm, hẹ, sốt tương đậu phộng",
            new BigDecimal("45000"),
            "/uploads/menu-items/goi-cuon.png",
            catKhaiVi.getId()
        );

        upsertMenuItem(
            "Bánh Mì Pâté Thịt Nguội",
            "Bánh mì nướng giòn rụm phết pâté gan béo ngậy, thịt nguội, chả lụa hảo hạng, dưa chuột và đồ chua cay nhẹ.",
            "Bánh mì vỏ giòn, pâté gan heo, chả lụa, thịt nguội, dưa leo, ngò rí, đồ chua, sốt ớt",
            new BigDecimal("35000"),
            "/uploads/menu-items/banh-mi.png",
            catKhaiVi.getId()
        );

        upsertMenuItem(
            "Chả Giò Rán Giòn Rụm",
            "Chả giò chiên vàng ươm giòn rụm nhân tôm thịt, mộc nhĩ nấm hương, chấm nước mắm tỏi ớt chua ngọt.",
            "Bánh tráng rế, thịt nạc dăm, tôm băm, mộc nhĩ, miến dong, cà rốt, trứng gà, nước mắm tỏi ớt",
            new BigDecimal("55000"),
            "/uploads/menu-items/cha-gio.png",
            catKhaiVi.getId()
        );

        upsertMenuItem(
            "Cơm Tấm Sườn Bì Chả",
            "Cơm tấm hạt dẻo thơm ăn kèm sườn cốt lết ướp mật ong nướng than hoa, chả trứng hấp, bì dai giòn và mỡ hành.",
            "Gạo tấm thơm, sườn heo ướp sả mật ong, bì heo sợi, chả trứng thịt, mỡ hành, nước mắm kẹo chua ngọt",
            new BigDecimal("75000"),
            "/uploads/menu-items/com-tam.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Bún Bò Huế Cung Đình",
            "Tô bún bò Huế chuẩn vị cố đô với nước dùng cay nồng hương sả, mắm ruốc, bắp bò hoa và chả cua giòn sần sật.",
            "Bún sợi to, bắp bò hoa, nạm bò, chả cua Huế, giò heo, sả cây, mắm ruốc Huế, ớt sa tế, hoa chuối",
            new BigDecimal("75000"),
            "/uploads/menu-items/bun-bo.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Cá Lóc Kho Tộ Đậm Đà",
            "Cá lóc đồng tươi kho tộ đất cùng nước mắm cá cơm, kẹo đắng đường thốt nốt, tiêu sọ cay nồng đưa cơm tuyệt hảo.",
            "Cá lóc đồng, nước mắm ngon, tiêu sọ đập dập, ớt hiểm, nước màu thốt nốt, hành tím phi, tóp mỡ",
            new BigDecimal("90000"),
            "/uploads/menu-items/ca-kho.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Lẩu Hải Sản Chua Cay Kiểu Thái",
            "Nồi lẩu đầy đặn tôm sú, mực ống tươi rói, nghêu trắng, nấm kim châm ngập tràn trong nước lẩu tomyum chua cay đậm đà.",
            "Tôm sú, mực ống, nghêu biển, nấm kim châm, cà chua, sả, lá chanh, riềng, nước cốt me, ớt xiêm",
            new BigDecimal("320000"),
            "/uploads/menu-items/lau-hs.png",
            catLauNuong.getId()
        );

        upsertMenuItem(
            "Thịt Ba Chỉ Nướng Bếp Than BBQ",
            "Thịt ba chỉ heo tươi ướp gia vị sốt BBQ bí truyền nướng xèo xèo trên than hồng, ăn kèm xà lách và sốt me cay.",
            "Thịt ba chỉ heo tươi, sả băm, tỏi, mật ong hoa nhãn, sốt BBQ, dầu hào, mè rang, xà lách",
            new BigDecimal("180000"),
            "/uploads/menu-items/thit-nuong.png",
            catLauNuong.getId()
        );

        upsertMenuItem(
            "Chè Ba Màu Nước Cốt Dừa",
            "Món tráng miệng truyền thống rực rỡ sắc màu gồm đậu đỏ bùi ngọt, đậu xanh nhuyễn mịn, thạch lá dứa và cốt dừa béo ngậy.",
            "Đậu đỏ, đậu xanh bóc vỏ, thạch lá dứa, nước cốt dừa tươi, nước đường thốt nốt, đá bào",
            new BigDecimal("35000"),
            "/uploads/menu-items/che.png",
            catTrangMieng.getId()
        );

        // 2. Danh sách 12 món ăn mới bổ sung để đa dạng menu (23 món)
        upsertMenuItem(
            "Nộm Ngó Sen Tôm Thịt",
            "Ngó sen tươi giòn ngọt trộn đều cùng tôm sú, thịt ba chỉ, cà rốt, rau răm và đậu phộng rang thơm phức.",
            "Ngó sen tươi, tôm sú luộc, thịt ba chỉ, cà rốt, rau răm, nước mắm tỏi ớt, đậu phộng rang",
            new BigDecimal("65000"),
            "/uploads/menu-items/nom-ngo-sen.png",
            catKhaiVi.getId()
        );

        upsertMenuItem(
            "Bò Lúc Lắc Khoai Tây Chiên",
            "Thịt thăn bò tươi cắt quân cờ xào lửa lớn cùng ớt chuông, hành tây thơm lừng, ăn kèm khoai tây chiên giòn tan.",
            "Thăn bò mềm, ớt chuông tam sắc, hành tây, bơ tỏi, dầu hào, khoai tây cọng chiên giòn",
            new BigDecimal("135000"),
            "/uploads/menu-items/bo-luc-lac.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Gà Nướng Mật Ong Tiêu Rừng",
            "Gà ta thả vườn nướng da vàng óng ánh, thịt mềm ngọt đậm đà phết lớp mật ong rừng và tiêu thơm nồng.",
            "Gà ta thả vườn, mật ong rừng, tiêu xanh, tỏi, nước mắm nhĩ, muối ớt chanh lá é",
            new BigDecimal("150000"),
            "/uploads/menu-items/ga-nuong.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Mực Ống Xào Sa Tế Cay Nồng",
            "Mực ống tươi dày mình giòn sần sật xào cùng sốt sa tế cay cay, hành tây và cần tây thơm nức.",
            "Mực ống biển tươi, ớt sa tế tôm, hành tây, cần tây, tỏi phi, dầu hào",
            new BigDecimal("120000"),
            "/uploads/menu-items/muc-xao.png",
            catChinh.getId()
        );

        upsertMenuItem(
            "Lẩu Gà Lá É Nấm Tươi",
            "Món lẩu đặc sản với nước dùng gà ngọt thanh hầm cùng măng tươi, nấm bào ngư và hương thơm độc đáo của lá é.",
            "Gà ta chặt miếng, lá é tươi, măng tươi, nấm bào ngư, nấm đùi gà, ớt xiêm xanh, bún tươi",
            new BigDecimal("280000"),
            "/uploads/menu-items/lau-ga.png",
            catLauNuong.getId()
        );

        upsertMenuItem(
            "Sườn Cây Nướng Sốt BBQ",
            "Sườn heo nguyên cây ướp sốt cay ngọt nướng xém cạnh, thịt mềm mọng nước róc xương dễ ăn.",
            "Sườn heo cây, sốt BBQ cay ngọt, tỏi băm, mật ong, tương cà, muối tiêu chanh",
            new BigDecimal("195000"),
            "/uploads/menu-items/suon-nuong.png",
            catLauNuong.getId()
        );

        upsertMenuItem(
            "Canh Chua Cá Nam Bộ",
            "Canh chua chuẩn vị miền Tây với cá tươi, dứa, cà chua, đậu bắp, bạc hà và nước cốt me thanh tao.",
            "Cá lóc khúc, dứa thơm, cà chua, đậu bắp, bạc hà, giá đỗ, nước me chua, ngò om, ngò gai",
            new BigDecimal("85000"),
            "/uploads/menu-items/canh-chua.png",
            catCanhRau.getId()
        );

        upsertMenuItem(
            "Rau Muống Xào Tỏi Xanh Mướt",
            "Rau muống ngọn non xanh mướt xào lửa to cùng thật nhiều tép tỏi đập dập thơm phức giòn rụm.",
            "Rau muống non, tỏi củ đập dập, dầu ăn, nước mắm nguyên chất, tiêu xay",
            new BigDecimal("45000"),
            "/uploads/menu-items/rau-xao-toi.png",
            catCanhRau.getId()
        );

        upsertMenuItem(
            "Trà Sen Vàng Long Nhãn",
            "Trà ướp hoa sen thượng hạng thanh mát kết hợp hạt sen bùi béo và cùi nhãn ngọt dịu xua tan mệt mỏi.",
            "Trà mạn ướp sen, hạt sen hầm mềm, cùi long nhãn, đường phèn, đá viên",
            new BigDecimal("40000"),
            "/uploads/menu-items/tra-sen.png",
            catDoUong.getId()
        );

        upsertMenuItem(
            "Cà Phê Sữa Đá Sài Gòn",
            "Cà phê Robusta pha phin nguyên chất đậm đà quyện cùng sữa đặc ngọt béo thơm lừng khởi đầu ngày mới.",
            "Cà phê nguyên chất rang mộc, sữa đặc có đường, đá viên tinh khiết",
            new BigDecimal("35000"),
            "/uploads/menu-items/ca-phe-sua.png",
            catDoUong.getId()
        );

        upsertMenuItem(
            "Trà Đào Cam Sả Tươi Mát",
            "Sự kết hợp sảng khoái giữa vị thanh dịu của trà đen, cam tươi mọng nước, hương sả nồng ấm và miếng đào giòn ngọt.",
            "Trà đen, đào ngâm giòn, nước cam tươi, sả cây tươi, siro đào, đá lạnh",
            new BigDecimal("45000"),
            "/uploads/menu-items/tra-dao.png",
            catDoUong.getId()
        );

        upsertMenuItem(
            "Chè Hạt Sen Nhãn Nhục Thanh Mát",
            "Chè hạt sen hầm đường phèn thanh tao kết hợp nhãn nhục giòn sần sật, giải nhiệt cơ thể cực kỳ tốt cho sức khỏe.",
            "Hạt sen tươi bóc vỏ, long nhãn nhục, đường phèn thanh khiết, nước hoa bưởi, đá viên",
            new BigDecimal("40000"),
            "/uploads/menu-items/che-hat-sen.png",
            catTrangMieng.getId()
        );
    }

    private void seedCombos() {
        // Combo 1: Combo Ăn Sáng Truyền Thống
        Combo c1 = upsertCombo(
            "Combo Ăn Sáng Truyền Thống",
            "Bữa sáng tiện lợi chuẩn vị với 1 Phở Bò Tái Nạm thơm nức mũi và 1 Cà Phê Sữa Đá Sài Gòn khởi đầu ngày mới.",
            new BigDecimal("85000"),
            "/uploads/menu-items/combo-an-sang.png"
        );
        linkComboItem(c1.getId(), "Phở Bò", 1);
        linkComboItem(c1.getId(), "Cà Phê Sữa Đá", 1);

        // Combo 2: Combo Cơm Trưa Văn Phòng
        Combo c2 = upsertCombo(
            "Combo Cơm Trưa Văn Phòng",
            "Set cơm trưa cân bằng dinh dưỡng gồm 1 Cơm Tấm Sườn Bì Chả nướng mật ong, 1 Chả Giò Rán Giòn Rụm và 1 ly Nước Cam Vắt Tươi.",
            new BigDecimal("110000"),
            "/uploads/menu-items/combo-com-trua.png"
        );
        linkComboItem(c2.getId(), "Cơm Tấm", 1);
        linkComboItem(c2.getId(), "Chả Giò", 1);
        linkComboItem(c2.getId(), "Nước Cam", 1);

        // Combo 3: Combo Hẹn Hò Đôi Lãng Mạn (2 người)
        Combo c3 = upsertCombo(
            "Combo Hẹn Hò Đôi Lãng Mạn (2 người)",
            "Thực đơn ngọt ngào dành cho 2 người gồm 1 Gỏi Cuốn Tôm Thịt khai vị, 1 Bò Lúc Lắc Khoai Tây, 1 Thịt Ba Chỉ Nướng BBQ và 2 ly Trà Sen Vàng.",
            new BigDecimal("299000"),
            "/uploads/menu-items/combo-hen-ho.png"
        );
        linkComboItem(c3.getId(), "Gỏi Cuốn", 1);
        linkComboItem(c3.getId(), "Bò Lúc Lắc", 1);
        linkComboItem(c3.getId(), "Thịt Ba Chỉ Nướng", 1);
        linkComboItem(c3.getId(), "Trà Sen Vàng", 2);

        // Combo 4: Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)
        Combo c4 = upsertCombo(
            "Combo Lẩu Hải Sản Sum Vầy (3 - 4 người)",
            "Bữa tiệc liên hoan ấm áp gồm 1 Nồi Lẩu Hải Sản Thái chua cay ngập tràn hải sản, 1 đĩa Nộm Ngó Sen Tôm Thịt giòn mát, 1 đĩa Chả Giò Rán Giòn và 3 ly Nước Cam Vắt Tươi.",
            new BigDecimal("450000"),
            "/uploads/menu-items/combo-lau-sum-vay.png"
        );
        linkComboItem(c4.getId(), "Lẩu Hải Sản", 1);
        linkComboItem(c4.getId(), "Nộm Ngó Sen", 1);
        linkComboItem(c4.getId(), "Chả Giò", 1);
        linkComboItem(c4.getId(), "Nước Cam", 3);

        // Combo 5: Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)
        Combo c5 = upsertCombo(
            "Combo Đại Tiệc Gia Đình Hoa Sen (5 - 6 người)",
            "Bữa cơm sum họp tròn vị gồm Lẩu Hải Sản Thái, Gà Nướng Mật Ong, Bò Lúc Lắc, Canh Chua Cá, Rau Muống Xào Tỏi và 4 phần Chè Ba Màu tráng miệng.",
            new BigDecimal("680000"),
            "/uploads/menu-items/combo-dai-tiec.png"
        );
        linkComboItem(c5.getId(), "Lẩu Hải Sản", 1);
        linkComboItem(c5.getId(), "Gà Nướng", 1);
        linkComboItem(c5.getId(), "Bò Lúc Lắc", 1);
        linkComboItem(c5.getId(), "Canh Chua", 1);
        linkComboItem(c5.getId(), "Rau Muống Xào", 1);
        linkComboItem(c5.getId(), "Chè Ba Màu", 4);
    }

    private Category getOrCreateCategory(String name, String description) {
        return categoryRepository.findByName(name).orElseGet(() -> {
            Category category = new Category();
            category.setName(name);
            category.setDescription(description);
            category.setStatus("ACTIVE");
            category.setCreatedAt(LocalDateTime.now());
            category.setUpdatedAt(LocalDateTime.now());
            return categoryRepository.save(category);
        });
    }

    private void upsertMenuItem(String name, String description, String ingredients, BigDecimal price, String image, Long categoryId) {
        // Tìm kiếm món ăn theo tên hoặc tên tương tự
        Optional<MenuItem> existing = menuItemRepository.findByName(name);
        if (existing.isEmpty()) {
            // Tìm thử theo từ khóa ngắn để nhận diện món đã có sẵn
            String keyword = name.split(" ")[0];
            List<MenuItem> matches = menuItemRepository.searchMenuItems(null, null, keyword);
            if (!matches.isEmpty()) {
                existing = Optional.of(matches.get(0));
            }
        }

        MenuItem item = existing.orElseGet(MenuItem::new);
        item.setName(name);
        item.setDescription(description);
        item.setMainIngredients(ingredients);
        item.setPrice(price);
        item.setImage(image);
        item.setStatus("ACTIVE");
        item.setCategoryId(categoryId);
        if (item.getCreatedAt() == null) {
            item.setCreatedAt(LocalDateTime.now());
        }
        item.setUpdatedAt(LocalDateTime.now());
        menuItemRepository.save(item);
    }

    private Combo upsertCombo(String name, String description, BigDecimal price, String image) {
        Combo combo = comboRepository.findByName(name).orElseGet(() -> {
            Combo c = new Combo();
            c.setCreatedAt(LocalDateTime.now());
            return c;
        });
        combo.setName(name);
        combo.setDescription(description);
        combo.setPrice(price);
        combo.setImage(image);
        combo.setStatus("ACTIVE");
        combo.setUpdatedAt(LocalDateTime.now());
        return comboRepository.save(combo);
    }

    private void linkComboItem(Long comboId, String menuItemKeyword, int quantity) {
        List<MenuItem> matchedItems = menuItemRepository.searchMenuItems(null, null, menuItemKeyword);
        if (!matchedItems.isEmpty()) {
            Long menuItemId = matchedItems.get(0).getId();
            ComboItem item = comboItemRepository.findByComboIdAndMenuItemId(comboId, menuItemId)
                    .orElseGet(() -> new ComboItem(comboId, menuItemId, quantity));
            item.setQuantity(quantity);
            comboItemRepository.save(item);
        }
    }

    private void seedUsers() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setFullName("Administrator");
            admin.setEmail("admin@restaurant.com");
            admin.setPhone("0123456789");
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
        }

        if (userRepository.findByUsername("receptionist").isEmpty()) {
            User receptionist = new User();
            receptionist.setUsername("receptionist");
            receptionist.setPassword(passwordEncoder.encode("123456"));
            receptionist.setFullName("Lễ Tân Nhà Hàng");
            receptionist.setEmail("receptionist@restaurant.com");
            receptionist.setPhone("0904111111");
            receptionist.setRole("RECEPTIONIST");
            receptionist.setStatus("ACTIVE");
            receptionist.setCreatedAt(LocalDateTime.now());
            receptionist.setUpdatedAt(LocalDateTime.now());
            userRepository.save(receptionist);
        }

        if (userRepository.findByUsername("bep01").isEmpty()) {
            User chef = new User();
            chef.setUsername("bep01");
            chef.setPassword(passwordEncoder.encode("123456"));
            chef.setFullName("Nguyễn Văn Bếp");
            chef.setEmail("bep01@restaurant.com");
            chef.setPhone("0901111111");
            chef.setRole("CHEF");
            chef.setStatus("ACTIVE");
            chef.setCreatedAt(LocalDateTime.now());
            chef.setUpdatedAt(LocalDateTime.now());
            userRepository.save(chef);
        }

        if (userRepository.findByUsername("phucvu01").isEmpty()) {
            User waiter1 = new User();
            waiter1.setUsername("phucvu01");
            waiter1.setPassword(passwordEncoder.encode("123456"));
            waiter1.setFullName("Lê Thị Mai");
            waiter1.setEmail("phucvu01@restaurant.com");
            waiter1.setPhone("0902111111");
            waiter1.setRole("WAITER");
            waiter1.setStatus("ACTIVE");
            waiter1.setCreatedAt(LocalDateTime.now());
            waiter1.setUpdatedAt(LocalDateTime.now());
            userRepository.save(waiter1);
        }

        if (userRepository.findByUsername("thungan01").isEmpty()) {
            User cashier = new User();
            cashier.setUsername("thungan01");
            cashier.setPassword(passwordEncoder.encode("123456"));
            cashier.setFullName("Võ Thị Thu");
            cashier.setEmail("thungan01@restaurant.com");
            cashier.setPhone("0903111111");
            cashier.setRole("CASHIER");
            cashier.setStatus("ACTIVE");
            cashier.setCreatedAt(LocalDateTime.now());
            cashier.setUpdatedAt(LocalDateTime.now());
            userRepository.save(cashier);
        }
    }

    private void seedSampleReservations() {
        if (reservationRepository.count() > 0) {
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        List<RestaurantTable> tables = restaurantTableRepository.findAll();
        RestaurantTable table1 = tables.size() > 0 ? tables.get(0) : null;
        RestaurantTable table2 = tables.size() > 1 ? tables.get(1) : null;

        Reservation r1 = new Reservation();
        r1.setCustomerName("Nguyễn Văn Tuấn");
        r1.setCustomerPhone("0901234567");
        r1.setCustomerEmail("tuan.nguyen@gmail.com");
        r1.setReservationDate(today);
        r1.setReservationTime(LocalTime.of(18, 30));
        r1.setNumberOfGuests(4);
        r1.setStatus("CONFIRMED");
        r1.setNote("Khách quen, muốn ngồi gần cửa sổ");
        r1.setTable(table1);
        r1.setCreatedAt(LocalDateTime.now().minusHours(3));
        r1.setUpdatedAt(LocalDateTime.now().minusHours(3));
        reservationRepository.save(r1);

        if (table1 != null) {
            table1.setStatus("RESERVED");
            restaurantTableRepository.save(table1);
        }

        Reservation r2 = new Reservation();
        r2.setCustomerName("Trần Thị Mai");
        r2.setCustomerPhone("0912345678");
        r2.setCustomerEmail("mai.tran@gmail.com");
        r2.setReservationDate(today);
        r2.setReservationTime(LocalTime.of(19, 0));
        r2.setNumberOfGuests(2);
        r2.setStatus("PENDING");
        r2.setNote("Kỷ niệm ngày cưới, cần không gian yên tĩnh");
        r2.setTable(null);
        r2.setCreatedAt(LocalDateTime.now().minusHours(1));
        r2.setUpdatedAt(LocalDateTime.now().minusHours(1));
        reservationRepository.save(r2);

        Reservation r3 = new Reservation();
        r3.setCustomerName("Lê Hoàng Long");
        r3.setCustomerPhone("0987654321");
        r3.setCustomerEmail("long.le@gmail.com");
        r3.setReservationDate(today);
        r3.setReservationTime(LocalTime.of(11, 30));
        r3.setNumberOfGuests(6);
        r3.setStatus("COMPLETED");
        r3.setNote("Ăn trưa công ty");
        r3.setTable(null);
        r3.setCreatedAt(LocalDateTime.now().minusHours(6));
        r3.setUpdatedAt(LocalDateTime.now().minusHours(5));
        reservationRepository.save(r3);

        Reservation r4 = new Reservation();
        r4.setCustomerName("Phạm Minh Đức");
        r4.setCustomerPhone("0933445566");
        r4.setCustomerEmail("duc.pham@gmail.com");
        r4.setReservationDate(tomorrow);
        r4.setReservationTime(LocalTime.of(19, 30));
        r4.setNumberOfGuests(8);
        r4.setStatus("CONFIRMED");
        r4.setNote("Tiệc sinh nhật, cần chuẩn bị 1 ghế trẻ em");
        r4.setTable(table2);
        r4.setCreatedAt(LocalDateTime.now().minusHours(2));
        r4.setUpdatedAt(LocalDateTime.now().minusHours(2));
        reservationRepository.save(r4);
    }
}
