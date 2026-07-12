package com.gympulse.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    public String saveImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file is empty.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new RuntimeException("Image size must be under 5MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed.");
        }

        // Create images subdirectory
        Path imagesDir = Paths.get(uploadDir, "images");
        if (!Files.exists(imagesDir)) {
            Files.createDirectories(imagesDir);
        }

        // Generate unique filename, preserve extension
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";
        String filename = UUID.randomUUID().toString() + ext;

        Path destination = imagesDir.resolve(filename);
        Files.copy(file.getInputStream(), destination);

        return filename;
    }

    public byte[] loadImage(String filename) throws IOException {
        Path filePath = Paths.get(uploadDir, "images", filename);
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Image not found: " + filename);
        }
        return Files.readAllBytes(filePath);
    }

    public String getContentType(String filename) {
        if (filename == null) return "image/jpeg";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public void deleteImage(String filename) {
        try {
            if (filename != null) {
                Path filePath = Paths.get(uploadDir, "images", filename);
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {}
    }
}