package com.gympulse.app.controller;

import com.gympulse.app.dto.AcceptManagerInviteRequest;
import com.gympulse.app.dto.AuthResponse;
import com.gympulse.app.dto.InviteValidationResponse;
import com.gympulse.app.service.ManagerInviteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/invites")
public class PublicInviteController {

    private final ManagerInviteService managerInviteService;

    public PublicInviteController(ManagerInviteService managerInviteService) {
        this.managerInviteService = managerInviteService;
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateInvite(@RequestParam("token") String token) {
        try {
            InviteValidationResponse response = managerInviteService.validateInvite(token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage(), "valid", false), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptInvite(@RequestBody AcceptManagerInviteRequest request) {
        try {
            AuthResponse response = managerInviteService.acceptInvite(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }
}
