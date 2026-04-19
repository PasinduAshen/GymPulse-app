package com.gympulse.app.config;

import com.gympulse.app.model.Admin;
import com.gympulse.app.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    @Bean
    public CommandLineRunner bootstrapAdmin(AdminRepository adminRepository,
                                            PasswordEncoder passwordEncoder,
                                            @Value("${app.bootstrap.admin.enabled:false}") boolean enabled,
                                            @Value("${app.bootstrap.admin.name:}") String name,
                                            @Value("${app.bootstrap.admin.username:}") String username,
                                            @Value("${app.bootstrap.admin.email:}") String email,
                                            @Value("${app.bootstrap.admin.password:}") String password) {
        return args -> {
            if (!enabled) {
                return;
            }

            if (adminRepository.countByRoleIgnoreCase("ADMIN") > 0) {
                return;
            }

            if (isBlank(name) || isBlank(username) || isBlank(email) || isBlank(password)) {
                throw new IllegalStateException(
                        "Admin bootstrap is enabled but required properties are missing: " +
                        "app.bootstrap.admin.name, app.bootstrap.admin.username, app.bootstrap.admin.email, app.bootstrap.admin.password"
                );
            }

            String normalizedEmail = email.trim();
            String normalizedUsername = username.trim();

            var existingByEmail = adminRepository.findByEmail(normalizedEmail);
            if (existingByEmail.isPresent()) {
                Admin existing = existingByEmail.get();
                if (!normalizedUsername.equalsIgnoreCase(existing.getUsername())) {
                    throw new IllegalStateException(
                            "Admin bootstrap email exists but username does not match. " +
                            "Update BOOTSTRAP_ADMIN_USERNAME to match the existing account username."
                    );
                }

                existing.setName(name.trim());
                existing.setPassword(passwordEncoder.encode(password));
                existing.setRole("ADMIN");
                adminRepository.save(existing);
                System.out.println("[GymPulse] Existing account promoted to ADMIN for: " + normalizedEmail);
                return;
            }

            if (adminRepository.findByUsername(normalizedUsername).isPresent()) {
                throw new IllegalStateException(
                        "Admin bootstrap username already exists with a different email."
                );
            }

            Admin admin = new Admin();
            admin.setName(name.trim());
            admin.setUsername(normalizedUsername);
            admin.setEmail(normalizedEmail);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole("ADMIN");
            adminRepository.save(admin);

            System.out.println("[GymPulse] Bootstrap admin account created for: " + email.trim());
        };
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
