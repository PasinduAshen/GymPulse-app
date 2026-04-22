package com.gympulse.app.controller;

import com.gympulse.app.dto.CreateManagerInviteRequest;
import com.gympulse.app.dto.ManagerInviteCreateResponse;
import com.gympulse.app.dto.ManagerInviteDto;
import com.gympulse.app.service.ManagerInviteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/manager-invites")
public class ManagerInviteController {

    private final ManagerInviteService managerInviteService;

    public ManagerInviteController(ManagerInviteService managerInviteService) {
        this.managerInviteService = managerInviteService;
    }

    @PostMapping
    public ResponseEntity<?> createInvite(@RequestBody CreateManagerInviteRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String inviterEmail = auth.getName();
            ManagerInviteCreateResponse response = managerInviteService.createInvite(inviterEmail, request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    public ResponseEntity<List<ManagerInviteDto>> listInvites() {
        return ResponseEntity.ok(managerInviteService.listInvites());
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<?> revokeInvite(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String reviewerEmail = auth.getName();
            return ResponseEntity.ok(managerInviteService.revokeInvite(id, reviewerEmail));
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }
}
