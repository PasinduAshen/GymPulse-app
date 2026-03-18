package com.gympulse.app.controller;

import com.gympulse.app.dto.AmcContractDto;
import com.gympulse.app.dto.ServiceCompletionRequest;
import com.gympulse.app.model.AmcContract;
import com.gympulse.app.model.ServiceSchedule;
import com.gympulse.app.service.AmcService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/amc")
public class AmcController {

    private final AmcService amcService;

    public AmcController(AmcService amcService) {
        this.amcService = amcService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        
        boolean isPdf = (contentType != null && contentType.equalsIgnoreCase("application/pdf")) || 
                        (filename != null && filename.toLowerCase().endsWith(".pdf"));

        if (file.isEmpty()) {
            return new ResponseEntity<>("File is empty", HttpStatus.BAD_REQUEST);
        }
        
        if (!isPdf) {
            return new ResponseEntity<>("File is not a PDF (Type: " + contentType + ", Name: " + filename + ")", HttpStatus.BAD_REQUEST);
        }

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return new ResponseEntity<>("User not authenticated", HttpStatus.UNAUTHORIZED);
            }
            String userEmail = auth.getName();
            AmcContract contract = amcService.savePdf(file, userEmail);
            return new ResponseEntity<>(contract.getId(), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/extract")
    public ResponseEntity<?> extractDetails(@RequestParam("amcId") Long amcId) {
        try {
            AmcContractDto details = amcService.extractDetailsWithLlm(amcId);
            return new ResponseEntity<>(details, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAmc(@PathVariable Long id, @RequestBody AmcContractDto dto) {
        try {
            AmcContract updated = amcService.updateAmc(id, dto);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/my-contracts")
    public ResponseEntity<List<AmcContract>> getMyContracts() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        return new ResponseEntity<>(amcService.getAmcsByAdmin(userEmail), HttpStatus.OK);
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<ServiceSchedule>> getMySchedules() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        return new ResponseEntity<>(amcService.getSchedulesByAdmin(userEmail), HttpStatus.OK);
    }

    @PostMapping("/schedules/{id}/complete")
    public ResponseEntity<?> completeService(@PathVariable Long id, @RequestBody ServiceCompletionRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            ServiceSchedule completed = amcService.completeService(id, request.getNotes(), userEmail);
            return new ResponseEntity<>(completed, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
