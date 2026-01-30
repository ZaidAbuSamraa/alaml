-- Create CashFlow Tables
-- Run this SQL script in your PostgreSQL database (pgAdmin, DBeaver, or any PostgreSQL client)
-- Database: alaml

-- Create cashflow_settings table
CREATE TABLE IF NOT EXISTS cashflow_settings (
    id SERIAL PRIMARY KEY,
    "defaultDailySales" DECIMAL(10,2) DEFAULT 6000,
    "safetyThreshold" DECIMAL(10,2) DEFAULT 2000,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cashflow_days table
CREATE TABLE IF NOT EXISTS cashflow_days (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    "openingCash" DECIMAL(10,2),
    sales DECIMAL(10,2),
    "manualSales" DECIMAL(10,2) DEFAULT 0,
    "useDefaultSales" BOOLEAN DEFAULT false,
    "deductSameDay" BOOLEAN DEFAULT true,
    notes TEXT,
    "isOpeningCashManual" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cashflow_payments table
CREATE TABLE IF NOT EXISTS cashflow_payments (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    "recipientName" VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    "cashFlowDayId" INTEGER REFERENCES cashflow_days(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO cashflow_settings ("defaultDailySales", "safetyThreshold")
VALUES (6000, 2000)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'CashFlow tables created successfully!' AS message;
