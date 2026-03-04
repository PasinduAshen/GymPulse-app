package com.gympulse.app.controller;

import com.gympulse.app.dto.AuthResponse;
import com.gympulse.app.dto.LoginRequest;
import com.gympulse.app.dto.RegistrationRequest;
import com.gympulse.app.model.Admin;
import com.gympulse.app.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequest request) {
        try {
            Admin admin = adminService.registerAdmin(request);
            return new ResponseEntity<>(new AuthResponse(null, "Registration successful"), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Email already exists") || e.getMessage().equals("Username already exists")) {
                return new ResponseEntity<>(new AuthResponse(null, e.getMessage()), HttpStatus.CONFLICT);
            }
            return new ResponseEntity<>(new AuthResponse(null, e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = adminService.loginAdmin(request);
            return new ResponseEntity<>(new AuthResponse(token, "Login successful"), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(new AuthResponse(null, e.getMessage()), HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            adminService.initiateForgotPassword(request.get("email"));
            return ResponseEntity.ok(new AuthResponse(null, "Recovery code sent to your email"));
        } catch (RuntimeException e) {
            return new ResponseEntity<>(new AuthResponse(null, e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        try {
            adminService.verifyResetCode(email, code);
            return ResponseEntity.ok(new AuthResponse(null, "Code verified successfully"));
        } catch (RuntimeException e) {
            return new ResponseEntity<>(new AuthResponse(null, e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            adminService.resetPassword(request.get("email"), request.get("code"), request.get("newPassword"));
            return ResponseEntity.ok(new AuthResponse(null, "Password reset successful"));
        } catch (RuntimeException e) {
            return new ResponseEntity<>(new AuthResponse(null, e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }
}
