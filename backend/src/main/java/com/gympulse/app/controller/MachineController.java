package com.gympulse.app.controller;

import com.gympulse.app.dto.MachineDto;
import com.gympulse.app.model.Machine;
import com.gympulse.app.repository.MachineRepository;
import com.gympulse.app.service.ImageStorageService;
import com.gympulse.app.service.MachineService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/machines")
public class MachineController {

    private final MachineService machineService;
    private final MachineRepository machineRepository;
    private final ImageStorageService imageStorageService;

    public MachineController(MachineService machineService,
                              MachineRepository machineRepository,
                              ImageStorageService imageStorageService) {
        this.machineService = machineService;
        this.machineRepository = machineRepository;
        this.imageStorageService = imageStorageService;
    }

    private String email() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> add(@Valid @RequestBody MachineDto dto) {
        return new ResponseEntity<>(machineService.addMachine(dto, email()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Machine>> getAll() {
        return ResponseEntity.ok(machineService.getAllMachines(email()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(machineService.getMachineById(id, email()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody MachineDto dto) {
        return ResponseEntity.ok(machineService.updateMachine(id, dto, email()));
    }

    // ✅ NEW: Delete machine
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        machineService.deleteMachine(id, email());
        return ResponseEntity.ok(Collections.singletonMap("message", "Machine deleted successfully"));
    }

    // ── Image Upload ──────────────────────────────────────────────────────────

    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id,
                                          @RequestParam("image") MultipartFile file) {
        try {
            Machine machine = machineService.getMachineById(id, email());

            // Delete old image if exists
            if (machine.getImageUrl() != null) {
                imageStorageService.deleteImage(machine.getImageUrl());
            }

            String filename = imageStorageService.saveImage(file);
            machine.setImageUrl(filename);
            machineRepository.save(machine);

            return ResponseEntity.ok(Collections.singletonMap("imageUrl", filename));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // ── Image Serve ───────────────────────────────────────────────────────────

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