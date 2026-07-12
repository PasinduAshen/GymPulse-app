package com.gympulse.app.repository;

import com.gympulse.app.model.ManagerInvite;
import com.gympulse.app.model.ManagerInviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManagerInviteRepository extends JpaRepository<ManagerInvite, Long> {
    List<ManagerInvite> findByStatusOrderByCreatedAtDesc(ManagerInviteStatus status);

    List<ManagerInvite> findByInvitedEmailAndStatus(String invitedEmail, ManagerInviteStatus status);
}
