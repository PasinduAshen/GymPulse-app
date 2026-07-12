package com.gympulse.app.service;

import com.gympulse.app.config.JwtUtil;
import com.gympulse.app.dto.*;
import com.gympulse.app.model.Admin;
import com.gympulse.app.model.ManagerInvite;
import com.gympulse.app.model.ManagerInviteStatus;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.ManagerInviteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
public class ManagerInviteService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ManagerInviteRepository managerInviteRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;

    @Value("${app.invite.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${app.invite.default-expiry-days:7}")
    private int defaultExpiryDays;

    public ManagerInviteService(ManagerInviteRepository managerInviteRepository,
                                AdminRepository adminRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService,
                                JwtUtil jwtUtil) {
        this.managerInviteRepository = managerInviteRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public ManagerInviteCreateResponse createInvite(String inviterEmail, CreateManagerInviteRequest request) {
        Admin inviter = adminRepository.findByEmail(inviterEmail)
                .orElseThrow(() -> new RuntimeException("Inviter not found"));

        if (!"ADMIN".equals(normalizeRole(inviter.getRole()))) {
            throw new RuntimeException("Only admins can create manager invites");
        }

        String invitedEmail = normalizeEmail(request.getEmail());
        if (invitedEmail.isEmpty()) {
            throw new RuntimeException("Invite email is required");
        }
        if (adminRepository.findByEmail(invitedEmail).isPresent()) {
            throw new RuntimeException("An account with this email already exists");
        }

        List<ManagerInvite> activeInvites = managerInviteRepository.findByInvitedEmailAndStatus(invitedEmail, ManagerInviteStatus.PENDING)
                .stream()
                .filter(invite -> invite.getExpiresAt() != null && invite.getExpiresAt().isAfter(LocalDateTime.now()))
                .toList();

        if (!activeInvites.isEmpty()) {
            throw new RuntimeException("An active invite already exists for this email");
        }

        int expiryDays = request.getExpiryDays() == null ? defaultExpiryDays : request.getExpiryDays();
        if (expiryDays < 1 || expiryDays > 30) {
            throw new RuntimeException("Expiry days must be between 1 and 30");
        }

        ManagerInvite invite = new ManagerInvite();
        invite.setInvitedEmail(invitedEmail);
        invite.setInvitedRole("MANAGER");
        invite.setStatus(ManagerInviteStatus.PENDING);
        invite.setInvitedBy(inviter);
        invite.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));
        invite.setTokenHash("temp");
        invite = managerInviteRepository.save(invite);

        String secret = generateSecretToken();
        invite.setTokenHash(passwordEncoder.encode(secret));
        invite = managerInviteRepository.save(invite);

        String publicToken = invite.getId() + "." + secret;
        String inviteLink = buildInviteLink(publicToken);

        emailService.sendManagerInvite(invitedEmail, inviteLink, invite.getExpiresAt(), inviter.getName());

        return new ManagerInviteCreateResponse(toDto(invite), inviteLink);
    }

    public List<ManagerInviteDto> listInvites() {
        return managerInviteRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ManagerInviteDto revokeInvite(Long inviteId, String reviewerEmail) {
        Admin reviewer = adminRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        if (!"ADMIN".equals(normalizeRole(reviewer.getRole()))) {
            throw new RuntimeException("Only admins can revoke invites");
        }

        ManagerInvite invite = managerInviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (invite.getStatus() != ManagerInviteStatus.PENDING) {
            throw new RuntimeException("Only pending invites can be revoked");
        }

        invite.setStatus(ManagerInviteStatus.REVOKED);
        invite.setRevokedAt(LocalDateTime.now());
        return toDto(managerInviteRepository.save(invite));
    }

    public InviteValidationResponse validateInvite(String token) {
        InviteTokenParts parts = parseToken(token);
        ManagerInvite invite = managerInviteRepository.findById(parts.id())
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!passwordEncoder.matches(parts.secret(), invite.getTokenHash())) {
            throw new RuntimeException("Invalid invite token");
        }

        if (invite.getStatus() == ManagerInviteStatus.USED) {
            throw new RuntimeException("This invite has already been used");
        }

        if (invite.getStatus() == ManagerInviteStatus.REVOKED) {
            throw new RuntimeException("This invite has been revoked");
        }

        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This invite has expired");
        }

        InviteValidationResponse response = new InviteValidationResponse();
        response.setValid(true);
        response.setInvitedEmail(invite.getInvitedEmail());
        response.setInvitedRole(invite.getInvitedRole());
        response.setExpiresAt(invite.getExpiresAt());
        response.setMessage("Invite token is valid");
        return response;
    }

    @Transactional
    public AuthResponse acceptInvite(AcceptManagerInviteRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }

        InviteTokenParts parts = parseToken(request.getToken());
        ManagerInvite invite = managerInviteRepository.findById(parts.id())
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!passwordEncoder.matches(parts.secret(), invite.getTokenHash())) {
            throw new RuntimeException("Invalid invite token");
        }

        if (invite.getStatus() != ManagerInviteStatus.PENDING) {
            throw new RuntimeException("Invite is no longer active");
        }

        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            invite.setStatus(ManagerInviteStatus.EXPIRED);
            managerInviteRepository.save(invite);
            throw new RuntimeException("This invite has expired");
        }

        String providedEmail = normalizeEmail(request.getEmail());
        if (!invite.getInvitedEmail().equalsIgnoreCase(providedEmail)) {
            throw new RuntimeException("Invite email does not match");
        }

        if (adminRepository.findByEmail(providedEmail).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (adminRepository.findByUsername(request.getUsername().trim()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        Admin manager = new Admin();
        manager.setName(request.getName().trim());
        manager.setUsername(request.getUsername().trim());
        manager.setEmail(providedEmail);
        manager.setPassword(passwordEncoder.encode(request.getPassword()));
        manager.setRole("MANAGER");
        adminRepository.save(manager);

        invite.setStatus(ManagerInviteStatus.USED);
        invite.setUsedAt(LocalDateTime.now());
        managerInviteRepository.save(invite);

        String jwt = jwtUtil.generateToken(manager.getEmail(), "MANAGER");
        return new AuthResponse(jwt, "Manager account created successfully");
    }

    private ManagerInviteDto toDto(ManagerInvite invite) {
        ManagerInviteDto dto = new ManagerInviteDto();
        dto.setId(invite.getId());
        dto.setInvitedEmail(invite.getInvitedEmail());
        dto.setInvitedRole(invite.getInvitedRole());
        dto.setStatus(invite.getStatus());
        dto.setCreatedAt(invite.getCreatedAt());
        dto.setExpiresAt(invite.getExpiresAt());
        dto.setUsedAt(invite.getUsedAt());
        dto.setRevokedAt(invite.getRevokedAt());
        dto.setInvitedByEmail(invite.getInvitedBy() == null ? null : invite.getInvitedBy().getEmail());
        return dto;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private String generateSecretToken() {
        byte[] bytes = new byte[24];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String buildInviteLink(String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return frontendBaseUrl + "/invite/accept?token=" + encodedToken;
    }

    private InviteTokenParts parseToken(String token) {
        if (token == null || token.trim().isEmpty() || !token.contains(".")) {
            throw new RuntimeException("Invalid invite token format");
        }

        String[] parts = token.split("\\.", 2);
        try {
            long id = Long.parseLong(parts[0]);
            String secret = parts[1];
            if (secret.isBlank()) {
                throw new RuntimeException("Invalid invite token format");
            }
            return new InviteTokenParts(id, secret);
        } catch (NumberFormatException ex) {
            throw new RuntimeException("Invalid invite token format");
        }
    }

    private record InviteTokenParts(long id, String secret) {
    }
}
