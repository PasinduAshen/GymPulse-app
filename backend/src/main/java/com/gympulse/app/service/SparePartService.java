package com.gympulse.app.service;

import com.gympulse.app.dto.SparePartDto;
import com.gympulse.app.model.Admin;
import com.gympulse.app.model.SparePart;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.SparePartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SparePartService {
    private final SparePartRepository sparePartRepository;
    private final AdminRepository adminRepository;

    public SparePartService(SparePartRepository r, AdminRepository a) {
        this.sparePartRepository = r; this.adminRepository = a;
    }

    private Admin getAdmin(String email) {
        return adminRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Admin account not found."));
    }

    private SparePartDto toDto(SparePart s) {
        SparePartDto d = new SparePartDto();
        d.setId(s.getId()); d.setName(s.getName()); d.setCategory(s.getCategory());
        d.setQuantity(s.getQuantity()); d.setReorderLevel(s.getReorderLevel());
        d.setUnitPrice(s.getUnitPrice()); d.setLowStock(s.isLowStock());
        d.setImageUrl(s.getImageUrl()); // ✅ ADDED
        return d;
    }

    @Transactional
    public SparePartDto addSparePart(SparePartDto dto, String email) {
        Admin admin = getAdmin(email);
        SparePart s = new SparePart();
        s.setAdmin(admin); s.setName(dto.getName()); s.setCategory(dto.getCategory());
        s.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 0);
        s.setReorderLevel(dto.getReorderLevel() != null ? dto.getReorderLevel() : 0);
        s.setUnitPrice(dto.getUnitPrice());
        return toDto(sparePartRepository.save(s));
    }

    public List<SparePartDto> getAllSpareParts(String email) {
        return sparePartRepository.findByAdminId(getAdmin(email).getId())
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public SparePartDto updateSparePart(Long id, SparePartDto dto, String email) {
        Admin admin = getAdmin(email);
        SparePart s = sparePartRepository.findByIdAndAdminId(id, admin.getId())
            .orElseThrow(() -> new RuntimeException("Spare part not found with ID: " + id));
        s.setName(dto.getName()); s.setCategory(dto.getCategory());
        s.setQuantity(dto.getQuantity()); s.setReorderLevel(dto.getReorderLevel());
        s.setUnitPrice(dto.getUnitPrice());
        return toDto(sparePartRepository.save(s));
    }

    @Transactional
    public void deleteSparePart(Long id, String email) {
        Admin admin = getAdmin(email);
        SparePart s = sparePartRepository.findByIdAndAdminId(id, admin.getId())
            .orElseThrow(() -> new RuntimeException("Spare part not found with ID: " + id));
        sparePartRepository.delete(s);
    }

    @Transactional
    public SparePartDto stockIn(Long id, Integer qty, String email) {
        Admin admin = getAdmin(email);
        SparePart s = sparePartRepository.findByIdAndAdminId(id, admin.getId())
            .orElseThrow(() -> new RuntimeException("Spare part not found with ID: " + id));
        s.setQuantity(s.getQuantity() + qty);
        return toDto(sparePartRepository.save(s));
    }

    @Transactional
    public SparePartDto stockOut(Long id, Integer qty, String email) {
        Admin admin = getAdmin(email);
        SparePart s = sparePartRepository.findByIdAndAdminId(id, admin.getId())
            .orElseThrow(() -> new RuntimeException("Spare part not found with ID: " + id));
        if (s.getQuantity() < qty)
            throw new RuntimeException("Insufficient stock. Available: " + s.getQuantity());
        s.setQuantity(s.getQuantity() - qty);
        return toDto(sparePartRepository.save(s));
    }

    public List<SparePartDto> getLowStockItems(String email) {
        return sparePartRepository.findLowStockByAdminId(getAdmin(email).getId())
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public long countSpareParts(String email) {
        return sparePartRepository.countByAdminId(getAdmin(email).getId());
    }

    public long countLowStock(String email) {
        return sparePartRepository.findLowStockByAdminId(getAdmin(email).getId()).size();
    }
}