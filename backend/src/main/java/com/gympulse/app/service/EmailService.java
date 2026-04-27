package com.gympulse.app.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetCode(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("GymPulse Password Recovery Code");
            message.setText("Your recovery code is: " + code + "\n\nThis code will expire in 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            // Error logged by Spring's mail sender or handled by GlobalExceptionHandler
        }
    }

    public void sendManagerInvite(String to, String inviteLink, LocalDateTime expiresAt, String inviterName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("GymPulse Manager Invitation");
            String expiryText = expiresAt == null
                    ? "N/A"
                    : expiresAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            message.setText(
                    "Hello,\n\n" +
                    (inviterName == null || inviterName.isBlank() ? "A GymPulse admin" : inviterName) +
                    " invited you to join as a Manager.\n\n" +
                    "Use this link to complete your account setup:\n" +
                    inviteLink + "\n\n" +
                    "This invite expires at: " + expiryText + "\n\n" +
                    "If you were not expecting this email, please ignore it."
            );
            mailSender.send(message);
        } catch (Exception e) {
            // Error logged by Spring's mail sender or handled by GlobalExceptionHandler
        }
    }
}
