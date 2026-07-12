package com.gympulse.app.controller;

import com.gympulse.app.dto.SparePartDto;
import com.gympulse.app.dto.StockRequest;
import com.gympulse.app.model.SparePart;
import com.gympulse.app.repository.SparePartRepository;
import com.gympulse.app.service.ImageStorageService;
import com.gympulse.app.service.SparePartService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/spare-parts")
public class SparePartController {

    private final SparePartService sparePartService;
    private final SparePartRepository sparePartRepository;
    private final ImageStorageService imageStorageService;

    public SparePartController(SparePartService sparePartService,
                                SparePartRepository sparePartRepository,
                                ImageStorageService imageStorageService) {
        this.sparePartService = sparePartService;
        this.sparePartRepository = sparePartRepository;
        this.imageStorageService = imageStorageService;
    }

    private String email() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> add(@Valid @RequestBody SparePartDto dto) {
        return new ResponseEntity<>(sparePartService.addSparePart(dto, email()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SparePartDto>> getAll() {
        return ResponseEntity.ok(sparePartService.getAllSpareParts(email()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody SparePartDto dto) {
        return ResponseEntity.ok(sparePartService.updateSparePart(id, dto, email()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        sparePartService.deleteSparePart(id, email());
        return ResponseEntity.ok(Collections.singletonMap("message", "Deleted successfully"));
    }

    // ── Stock ─────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/stock-in")
    public ResponseEntity<?> stockIn(@PathVariable Long id, @Valid @RequestBody StockRequest req) {
        return ResponseEntity.ok(sparePartService.stockIn(id, req.getQuantity(), email()));
    }

    @PostMapping("/{id}/stock-out")
    public ResponseEntity<?> stockOut(@PathVariable Long id, @Valid @RequestBody StockRequest req) {
        return ResponseEntity.ok(sparePartService.stockOut(id, req.getQuantity(), email()));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<SparePartDto>> lowStock() {
        return ResponseEntity.ok(sparePartService.getLowStockItems(email()));
    }

    // ── Image Upload ──────────────────────────────────────────────────────────

    /**
     * POST /api/spare-parts/{id}/image
     * Upload or replace the image for a spare part.
     */
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id,
                                          @RequestParam("image") MultipartFile file) {
        try {
            // Fetch the spare part entity directly (SparePartDto doesn't expose imageUrl)
            SparePart part = sparePartRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Spare part not found: " + id));

            // Delete old image if exists
            if (part.getImageUrl() != null) {
                imageStorageService.deleteImage(part.getImageUrl());
            }

            String filename = imageStorageService.saveImage(file);
            part.setImageUrl(filename);
            sparePartRepository.save(part);

            return ResponseEntity.ok(Collections.singletonMap("imageUrl", filename));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // ── Image Serve ───────────────────────────────────────────────────────────

    /**
     * GET /api/spare-parts/image/{filename}
     * Serve a spare part image file.
     */
    @GetMapping("/image/{filename}")
    public ResponseEntity<byte[]> serveImage(@PathVariable String filename) {
        try {
            byte[] imageBytes = imageStorageService.loadImage(filename);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(imageStorageService.getContentType(filename)));
            headers.setCacheControl(CacheControl.maxAge(7, java.util.concurrent.TimeUnit.DAYS));
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}