package com.gympulse.app.service;

import com.gympulse.app.dto.MachineDto;
import com.gympulse.app.model.Admin;
import com.gympulse.app.model.Machine;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.MachineRepository;
import com.gympulse.app.service.ImageStorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class MachineService {

    private final MachineRepository machineRepository;
    private final AdminRepository adminRepository;
    private final ImageStorageService imageStorageService;

    public MachineService(MachineRepository machineRepository,
                          AdminRepository adminRepository,
                          ImageStorageService imageStorageService) {
        this.machineRepository = machineRepository;
        this.adminRepository = adminRepository;
        this.imageStorageService = imageStorageService;
    }

    private Admin getAdmin(String email) {
        return adminRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Admin account not found."));
    }

    @Transactional
    public Machine addMachine(MachineDto dto, String email) {
        Admin admin = getAdmin(email);
        Machine m = new Machine();
        m.setAdmin(admin);
        m.setName(dto.getName());
        m.setBrand(dto.getBrand());
        m.setModel(dto.getModel());
        m.setCategory(dto.getCategory());
        m.setPurchaseDate(dto.getPurchaseDate());
        m.setStatus(dto.getStatus());
        return machineRepository.save(m);
    }

    public List<Machine> getAllMachines(String email) {
        return machineRepository.findByAdminId(getAdmin(email).getId());
    }

    public Machine getMachineById(Long id, String email) {
        return machineRepository.findByIdAndAdminId(id, getAdmin(email).getId())
            .orElseThrow(() -> new RuntimeException("Machine not found with ID: " + id));
    }

    @Transactional
    public Machine updateMachine(Long id, MachineDto dto, String email) {
        Machine m = getMachineById(id, email);
        m.setName(dto.getName());
        m.setBrand(dto.getBrand());
        m.setModel(dto.getModel());
        m.setCategory(dto.getCategory());
        m.setPurchaseDate(dto.getPurchaseDate());
        m.setStatus(dto.getStatus());
        return machineRepository.save(m);
    }

    // ✅ NEW: Delete machine — image file ද delete කරනවා
    @Transactional
    public void deleteMachine(Long id, String email) {
        Machine m = getMachineById(id, email);
        // Delete image file if exists
        if (m.getImageUrl() != null) {
            imageStorageService.deleteImage(m.getImageUrl());
        }
        machineRepository.delete(m);
    }

    public long countMachines(String email) {
        return machineRepository.countByAdminId(getAdmin(email).getId());
    }
}