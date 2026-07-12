package com.gympulse.app.dto;

import java.time.LocalDateTime;

public class InviteValidationResponse {
    private boolean valid;
    private String invitedEmail;
    private String invitedRole;
    private String message;
    private LocalDateTime expiresAt;

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getInvitedEmail() {
        return invitedEmail;
    }

    public void setInvitedEmail(String invitedEmail) {
        this.invitedEmail = invitedEmail;
    }

    public String getInvitedRole() {
        return invitedRole;
    }

    public void setInvitedRole(String invitedRole) {
        this.invitedRole = invitedRole;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
