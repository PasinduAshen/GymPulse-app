-- GymPulse Database Schema

CREATE DATABASE IF NOT EXISTS gympulse;
USE gympulse;

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- AMC Contracts Table
CREATE TABLE IF NOT EXISTS amc_contracts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    company_name VARCHAR(255),
    machine_name VARCHAR(255),
    brand VARCHAR(255),
    start_date DATE,
    end_date DATE,
    service_frequency VARCHAR(255),
    contact_info TEXT,
    pdf_filename VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Service Schedules Table
CREATE TABLE IF NOT EXISTS service_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amc_id BIGINT NOT NULL,
    scheduled_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_amc FOREIGN KEY (amc_id) REFERENCES amc_contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
