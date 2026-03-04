package com.gympulse.app.controller;

import com.gympulse.app.dto.AuthResponse;
import com.gympulse.app.dto.LoginRequest;
import com.gympulse.app.dto.RegistrationRequest;
import com.gympulse.app.model.Admin;
import com.gympulse.app.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminService adminService;

    public AuthController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequest request) {
        try {
            Admin admin = adminService.registerAdmin(request);
            return new ResponseEntity<>(new AuthResponse(null, "Registration successful"), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Email already exists")) {
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
}
