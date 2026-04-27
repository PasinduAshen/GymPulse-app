package com.gympulse.app.controller;

import com.gympulse.app.service.MachineService;
import com.gympulse.app.service.SparePartService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryDashboardController {
    private final MachineService machineService;
    private final SparePartService sparePartService;

    public InventoryDashboardController(MachineService m, SparePartService s) {
        this.machineService = m; this.sparePartService = s;
    }

    private String email() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        String email = email();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMachines", machineService.countMachines(email));
        stats.put("totalSpareParts", sparePartService.countSpareParts(email));
        stats.put("lowStockCount", sparePartService.countLowStock(email));
        stats.put("lowStockItems", sparePartService.getLowStockItems(email));
        return ResponseEntity.ok(stats);
    }
}