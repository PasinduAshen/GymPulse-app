package com.gympulse.app.service;

import com.gympulse.app.dto.AmcContractDto;
import com.gympulse.app.model.*;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.AmcContractRepository;
import com.gympulse.app.repository.ServiceScheduleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;

@Service
public class AmcService {

    private final AmcContractRepository amcContractRepository;
    private final AdminRepository adminRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${llm.api.key}")
    private String llmApiKey;

    @Value("${llm.model}")
    private String llmModel;

    public AmcService(AmcContractRepository amcContractRepository, 
                      AdminRepository adminRepository, 
                      ServiceScheduleRepository serviceScheduleRepository,
                      ObjectMapper objectMapper) {
        this.amcContractRepository = amcContractRepository;
        this.adminRepository = adminRepository;
        this.serviceScheduleRepository = serviceScheduleRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public AmcContract savePdf(MultipartFile file, String userEmail) throws IOException {
        Admin admin = adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        AmcContract contract = new AmcContract();
        contract.setAdmin(admin);
        contract.setPdfFilename(filename);
        contract.setStatus("UPLOADED");
        return amcContractRepository.save(contract);
    }

    public AmcContractDto extractDetailsWithLlm(Long amcId) throws IOException {
        AmcContract contract = amcContractRepository.findById(amcId)
                .orElseThrow(() -> new RuntimeException("The requested contract could not be found."));

        Path filePath = Paths.get(uploadDir).resolve(contract.getPdfFilename());
        
        String text;
        try {
            text = extractTextFromPdf(filePath.toFile());
            if (text == null || text.trim().isEmpty()) {
                throw new RuntimeException("PDF is empty or contains no readable text.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Unable to read the PDF content. Please ensure the file is not corrupted or contains readable text.");
        }

        String prompt = "Extract AMC contract details from the following text in JSON format. "
        + "Return ONLY valid JSON. If a field is not found, leave it empty.\n"
        + "JSON Structure:\n"
        + "{\n"
        + "  \"companyName\": \"The service provider company name\",\n"
        + "  \"machineName\": \"Name of the machine being serviced (e.g. Treadmill X1)\",\n"
        + "  \"brand\": \"Brand of the machine (e.g. LifeFitness)\",\n"
        + "  \"startDate\": \"YYYY-MM-DD\",\n"
        + "  \"endDate\": \"YYYY-MM-DD\",\n"
        + "  \"serviceFrequency\": \"Frequency of service (e.g. 3 months, 4 months)\",\n"
        + "  \"contactInfo\": \"Contact info including phone or email\"\n"
        + "}\n"
        + "Text to extract from:\n"
        + text;
        try {
            String llmResponse = callLlm(prompt);
            AmcContractDto dto = parseLlmResponse(llmResponse);
            
            if ((dto.getCompanyName() == null || dto.getCompanyName().isEmpty()) && 
                (dto.getMachineName() == null || dto.getMachineName().isEmpty())) {
                throw new RuntimeException("AI was unable to extract core contract details from the PDF.");
            }

            dto.setId(amcId);
            dto.setPdfFilename(contract.getPdfFilename());
            dto.setStatus("EXTRACTED");

            contract.setStatus("EXTRACTED");
            amcContractRepository.save(contract);

            return dto;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            if (e.getStatusCode() == org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE) {
                throw new RuntimeException("The AI service is currently overloaded due to high demand. Please wait a moment and click 'Retry AI Extraction'.");
            }
            throw new RuntimeException("AI Service Error: " + e.getStatusCode());
        } catch (Exception e) {
            throw new RuntimeException("Extraction failed: " + e.getMessage());
        }
    }

    private String extractTextFromPdf(File file) throws IOException {
        try (PDDocument document = PDDocument.load(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String callLlm(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + llmModel + ":generateContent?key=" + llmApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", List.of(part));
        body.put("contents", List.of(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            } catch (Exception e) {
                throw new RuntimeException("The AI returned an invalid response format.");
            }
        } else {
            throw new RuntimeException("AI Service Error: " + response.getStatusCode());
        }
    }

    private AmcContractDto parseLlmResponse(String jsonString) throws IOException {
        int start = jsonString.indexOf("{");
        int end = jsonString.lastIndexOf("}");
        if (start == -1 || end == -1) {
            throw new RuntimeException("No valid data found in AI response.");
        }
        jsonString = jsonString.substring(start, end + 1);
        
        return objectMapper.readValue(jsonString, AmcContractDto.class);
    }

    public List<AmcContract> getAmcsByAdmin(String userEmail) {
        adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));
        return amcContractRepository.findAll();
    }

    public List<ServiceSchedule> getSchedulesByAdmin(String userEmail) {
        adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));
        return serviceScheduleRepository.findAllWithContract();
    }

        public List<ServiceSchedule> filterSchedules(String userEmail,
                             ServiceStatus status,
                             String machineName,
                             String brand,
                             String companyName,
                             LocalDate startDate,
                             LocalDate endDate) {
        adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));

        return serviceScheduleRepository.findAllWithContract().stream()
            .filter(schedule -> status == null || schedule.getStatus() == status)
            .filter(schedule -> machineName == null || machineName.isBlank() ||
                (schedule.getAmcContract() != null &&
                 schedule.getAmcContract().getMachineName() != null &&
                 schedule.getAmcContract().getMachineName().toLowerCase().contains(machineName.toLowerCase())))
            .filter(schedule -> brand == null || brand.isBlank() ||
                (schedule.getAmcContract() != null &&
                 schedule.getAmcContract().getBrand() != null &&
                 schedule.getAmcContract().getBrand().toLowerCase().contains(brand.toLowerCase())))
            .filter(schedule -> companyName == null || companyName.isBlank() ||
                (schedule.getAmcContract() != null &&
                 schedule.getAmcContract().getCompanyName() != null &&
                 schedule.getAmcContract().getCompanyName().toLowerCase().contains(companyName.toLowerCase())))
            .filter(schedule -> startDate == null || !schedule.getScheduledDate().isBefore(startDate))
            .filter(schedule -> endDate == null || !schedule.getScheduledDate().isAfter(endDate))
            .sorted(Comparator.comparing(ServiceSchedule::getScheduledDate))
            .toList();
    }

    public List<ServiceSchedule> getServiceHistory(Long amcId, String userEmail) {
        adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));
        
        AmcContract contract = amcContractRepository.findById(amcId)
                .orElseThrow(() -> new RuntimeException("Contract not found with ID: " + amcId));

        return serviceScheduleRepository.findHistoryByAmcId(amcId);
    }

    @Transactional
    public ServiceSchedule completeService(Long serviceId, String notes, String userEmail) {
        Admin admin = adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));

        String role = admin.getRole() == null ? "" : admin.getRole();
        if (!"ADMIN".equalsIgnoreCase(role) && !"MANAGER".equalsIgnoreCase(role)) {
            throw new RuntimeException("Unauthorized: You cannot complete services.");
        }

        ServiceSchedule schedule = serviceScheduleRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service schedule not found with ID: " + serviceId));

        if (ServiceStatus.COMPLETED.equals(schedule.getStatus())) {
            return schedule;
        }

        schedule.setStatus(ServiceStatus.COMPLETED);
        schedule.setCompletedDate(LocalDate.now());
        schedule.setNotes(notes);

        return serviceScheduleRepository.save(schedule);
    }

    @Transactional
    public AmcContract updateAmc(Long id, AmcContractDto dto) {
        AmcContract contract = amcContractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found with ID: " + id));

        contract.setCompanyName(dto.getCompanyName());
        contract.setMachineName(dto.getMachineName());
        contract.setBrand(dto.getBrand());
        contract.setStartDate(dto.getStartDate());
        contract.setEndDate(dto.getEndDate());
        contract.setServiceFrequency(dto.getServiceFrequency());
        contract.setContactInfo(dto.getContactInfo());
        
        if (dto.getEndDate() != null && dto.getEndDate().isBefore(java.time.LocalDate.now())) {
            contract.setStatus("EXPIRED");
        } else {
            contract.setStatus("ACTIVE");
            generateServiceSchedules(contract);
        }

        return amcContractRepository.save(contract);
    }

    private void generateServiceSchedules(AmcContract contract) {
        serviceScheduleRepository.deleteByAmcContractId(contract.getId());

        if (contract.getStartDate() == null || contract.getEndDate() == null || contract.getServiceFrequency() == null) {
            return;
        }

        int monthsToAdd = 0;
        String freq = contract.getServiceFrequency().toLowerCase();

        if (freq.contains("monthly")) monthsToAdd = 1;
        else if (freq.contains("quarterly")) monthsToAdd = 3;
        else if (freq.contains("half-yearly") || freq.contains("6 months")) monthsToAdd = 6;
        else if (freq.contains("annually") || freq.contains("yearly")) monthsToAdd = 12;
        else {
            try {
                String numericPart = freq.replaceAll("[^0-9]", "");
                if (!numericPart.isEmpty()) monthsToAdd = Integer.parseInt(numericPart);
            } catch (Exception e) { monthsToAdd = 3; }
        }

        if (monthsToAdd <= 0) monthsToAdd = 3;

        LocalDate nextDate = contract.getStartDate().plusMonths(monthsToAdd);
        LocalDate today = LocalDate.now();
        
        while (nextDate.isBefore(contract.getEndDate()) || nextDate.isEqual(contract.getEndDate())) {
            ServiceSchedule schedule = new ServiceSchedule();
            schedule.setAmcContract(contract);
            schedule.setScheduledDate(nextDate);
            
            // Logic to set status to OVERDUE if generated for a past date
            if (nextDate.isBefore(today)) {
                schedule.setStatus(ServiceStatus.OVERDUE);
            } else {
                schedule.setStatus(ServiceStatus.PENDING);
            }
            
            serviceScheduleRepository.save(schedule);
            nextDate = nextDate.plusMonths(monthsToAdd);
        }
    }

    /**
     * Scheduled job to detect overdue services and update contract statuses daily.
     * Runs every day at midnight.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void runDailyMaintenance() {
        LocalDate today = LocalDate.now();
        
        // 1. Detect and update Overdue services (SCRUM-63, 64, 65)
        List<ServiceSchedule> overdueSchedules = serviceScheduleRepository.findOverdueSchedules(today);
        for (ServiceSchedule schedule : overdueSchedules) {
            // Ensure logic excludes COMPLETED services (SCRUM-66)
            if (schedule.getStatus() == ServiceStatus.PENDING) {
                schedule.setStatus(ServiceStatus.OVERDUE);
                serviceScheduleRepository.save(schedule);
                System.out.println("Service Schedule ID " + schedule.getId() + " marked as OVERDUE.");
            }
        }

        // 2. Update Contract statuses (ACTIVE -> EXPIRED)
        List<AmcContract> contracts = amcContractRepository.findAll();
        for (AmcContract contract : contracts) {
            if ("ACTIVE".equals(contract.getStatus()) && 
                contract.getEndDate() != null && 
                contract.getEndDate().isBefore(today)) {
                
                contract.setStatus("EXPIRED");
                amcContractRepository.save(contract);
                System.out.println("Contract ID " + contract.getId() + " status updated to EXPIRED.");
            }
        }
    }
}
