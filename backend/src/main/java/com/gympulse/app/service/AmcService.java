package com.gympulse.app.service;

import com.gympulse.app.dto.AmcContractDto;
import com.gympulse.app.model.Admin;
import com.gympulse.app.model.AmcContract;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.AmcContractRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class AmcService {

    private final AmcContractRepository amcContractRepository;
    private final AdminRepository adminRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${llm.api.key}")
    private String llmApiKey;

    @Value("${llm.model}")
    private String llmModel;

    public AmcService(AmcContractRepository amcContractRepository, AdminRepository adminRepository) {
        this.amcContractRepository = amcContractRepository;
        this.adminRepository = adminRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
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
        } catch (Exception e) {
            throw new RuntimeException("Unable to read the PDF content. Please ensure the file is not corrupted.");
        }

        String prompt = "Extract AMC contract details from the following text in JSON format. " +
                "If a field is not found, leave it empty. " +
                "Fields: companyName, machineName, brand, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), serviceFrequency, contactInfo. " +
                "Return ONLY valid JSON.\n\n" +
                "Text: " + text;

        try {
            String llmResponse = callLlm(prompt);
            AmcContractDto dto = parseLlmResponse(llmResponse);
            dto.setId(amcId);
            dto.setPdfFilename(contract.getPdfFilename());
            dto.setStatus("EXTRACTED");

            contract.setStatus("EXTRACTED");
            amcContractRepository.save(contract);

            return dto;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            throw new RuntimeException("The AI extraction service is currently unavailable. You can still enter details manually.");
        } catch (Exception e) {
            throw new RuntimeException("Automatic extraction failed. Please fill in the contract details manually below.");
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

    private AmcContractDto parseLlmResponse(String jsonString) {
        try {
            int start = jsonString.indexOf("{");
            int end = jsonString.lastIndexOf("}");
            if (start == -1 || end == -1) {
                throw new RuntimeException("No valid data found in AI response.");
            }
            jsonString = jsonString.substring(start, end + 1);
            
            return objectMapper.readValue(jsonString, AmcContractDto.class);
        } catch (Exception e) {
            AmcContractDto fallback = new AmcContractDto();
            fallback.setCompanyName("");
            fallback.setMachineName("Manual Entry Required");
            return fallback;
        }
    }

    public List<AmcContract> getAmcsByAdmin(String userEmail) {
        Admin admin = adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));
        return amcContractRepository.findByAdminId(admin.getId());
    }

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
        }

        return amcContractRepository.save(contract);
    }
}
