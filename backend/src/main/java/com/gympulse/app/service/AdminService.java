package com.gympulse.app.service;

import com.gympulse.app.config.JwtUtil;
import com.gympulse.app.dto.LoginRequest;
import com.gympulse.app.dto.RegistrationRequest;
import com.gympulse.app.model.Admin;
import com.gympulse.app.repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AdminService(AdminRepository adminRepository,
                        PasswordEncoder passwordEncoder,
                        JwtUtil jwtUtil,
                        EmailService emailService) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    public void initiateForgotPassword(String email) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        admin.setResetCode(code);
        admin.setResetCodeExpires(java.time.LocalDateTime.now().plusMinutes(10));
        adminRepository.save(admin);

        emailService.sendResetCode(email, code);
    }

    public void verifyResetCode(String email, String code) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String dbCode = (admin.getResetCode() != null) ? admin.getResetCode().trim() : null;
        String inputCode = (code != null) ? code.trim() : "";

        if (dbCode == null || !dbCode.equalsIgnoreCase(inputCode)) {
            throw new RuntimeException("The recovery code you entered is incorrect.");
        }

        if (admin.getResetCodeExpires() == null || admin.getResetCodeExpires().plusMinutes(5).isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("This recovery code has expired. Please request a new one.");
        }
    }

    public void resetPassword(String email, String code, String newPassword) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid request"));

        if (admin.getResetCode() == null || !admin.getResetCode().equals(code)) {
            throw new RuntimeException("Invalid recovery code");
        }

        if (admin.getResetCodeExpires().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Recovery code has expired");
        }

        admin.setPassword(passwordEncoder.encode(newPassword));
        admin.setResetCode(null);
        admin.setResetCodeExpires(null);
        adminRepository.save(admin);
    }

    public Admin registerAdmin(RegistrationRequest request) {
        if (request.getName() == null || request.getName().isEmpty()) {
            throw new RuntimeException("Name is required");
        }
        if (request.getEmail() == null || !request.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new RuntimeException("Invalid email format");
        }
        if (adminRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (adminRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (request.getPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }

        Admin admin = new Admin();
        admin.setName(request.getName());
        admin.setUsername(request.getUsername());
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole("USER");

        return adminRepository.save(admin);
    }

    public String loginAdmin(LoginRequest request) {
        String identifier = request.getEmail(); // This field will now be treated as either email or username
        Admin admin = adminRepository.findByEmail(identifier)
                .or(() -> adminRepository.findByUsername(identifier))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String role = admin.getRole() == null ? "USER" : admin.getRole().toUpperCase();
        return jwtUtil.generateToken(admin.getEmail(), role);
    }
}
