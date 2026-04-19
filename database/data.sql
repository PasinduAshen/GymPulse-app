-- Initial Data for GymPulse

USE gympulse;

-- Inserting a test admin (password: password123, but BCrypt hashed)
-- Password hashed for BCrypt ($2a$10$7O7T/K5xO8FvB8O/O/O/O.7k9n8k0p8m6B8O/O/O/O.7k9n8k0p8m6)
-- Note: It is better to register through the UI to ensure hashing is consistent.
-- INSERT INTO admins (email, name, username, password, role) 
-- VALUES ('test@gympulse.com', 'Test Admin', 'testadmin', '$2a$10$7O7T/K5xO8FvB8O/O/O/O.7k9n8k0p8m6B8O/O/O/O.7k9n8k0p8m6', 'ADMIN');

-- Sample AMC Contracts (Optional)
-- INSERT INTO amc_contracts (admin_id, company_name, machine_name, brand, status)
-- VALUES (1, 'Fitness First', 'Treadmill T90', 'Technogym', 'CONFIRMED');
