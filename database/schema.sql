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
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Manager Invites Table (new onboarding flow)
CREATE TABLE IF NOT EXISTS manager_invites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invited_email VARCHAR(255) NOT NULL,
    invited_role VARCHAR(50) NOT NULL DEFAULT 'MANAGER',
    token_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    invited_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    CONSTRAINT fk_manager_invite_inviter FOREIGN KEY (invited_by) REFERENCES admins(id) ON DELETE CASCADE
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
    completed_date DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_amc FOREIGN KEY (amc_id) REFERENCES amc_contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- AMC Payments Table
CREATE TABLE IF NOT EXISTS amc_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amc_id BIGINT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_date DATE,
    payment_method VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_amc FOREIGN KEY (amc_id) REFERENCES amc_contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
