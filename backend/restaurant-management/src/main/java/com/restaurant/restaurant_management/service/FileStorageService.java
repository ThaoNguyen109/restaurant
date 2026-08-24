package com.restaurant.restaurant_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif");

    @Value("${file.upload-dir:uploads/menu-items}")
    private String uploadDir;

    /**
     * Lưu file hình ảnh vào thư mục upload và trả về đường dẫn URL tương đối (ví dụ: /uploads/menu-items/abc.jpg)
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new RuntimeException("Tên file không hợp lệ");
        }

        String cleanedFilename = StringUtils.cleanPath(originalFilename);
        String extension = "";
        int dotIndex = cleanedFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = cleanedFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Chỉ chấp nhận các định dạng ảnh: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        try {
            Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDirectory)) {
                Files.createDirectories(targetDirectory);
            }

            // Tạo tên file duy nhất tránh trùng lặp
            String uniqueFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;
            Path targetLocation = targetDirectory.resolve(uniqueFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            // Chuẩn hóa đường dẫn trả về theo dạng URL: /uploads/menu-items/filename.jpg
            String normalizedDir = uploadDir.replace("\\", "/");
            if (!normalizedDir.startsWith("/")) {
                normalizedDir = "/" + normalizedDir;
            }
            if (!normalizedDir.endsWith("/")) {
                normalizedDir = normalizedDir + "/";
            }

            return normalizedDir + uniqueFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file ảnh: " + ex.getMessage(), ex);
        }
    }

    /**
     * Xóa file ảnh khỏi ổ đĩa khi cập nhật ảnh mới hoặc xóa món ăn
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        try {
            // Lấy tên file hoặc đường dẫn tương đối từ URL
            String relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            Path filePath = Paths.get(relativePath).toAbsolutePath().normalize();

            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (Exception ignored) {
            // Bỏ qua lỗi nếu file không tồn tại hoặc không xóa được
        }
    }
}
