package com.gympulse.app.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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
}
