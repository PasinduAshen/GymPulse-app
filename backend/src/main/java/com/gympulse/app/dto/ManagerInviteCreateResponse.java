package com.gympulse.app.dto;

public class ManagerInviteCreateResponse {
    private ManagerInviteDto invite;
    private String inviteLink;

    public ManagerInviteCreateResponse() {
    }

    public ManagerInviteCreateResponse(ManagerInviteDto invite, String inviteLink) {
        this.invite = invite;
        this.inviteLink = inviteLink;
    }

    public ManagerInviteDto getInvite() {
        return invite;
    }

    public void setInvite(ManagerInviteDto invite) {
        this.invite = invite;
    }

    public String getInviteLink() {
        return inviteLink;
    }

    public void setInviteLink(String inviteLink) {
        this.inviteLink = inviteLink;
    }
}
