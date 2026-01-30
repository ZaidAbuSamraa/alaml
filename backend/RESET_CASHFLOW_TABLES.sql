-- RESET CASHFLOW TABLES
-- This will delete all cashflow data and recreate tables with correct schema
-- Run this in pgAdmin or any PostgreSQL client connected to 'alaml' database

-- Step 1: Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS cashflow_payments CASCADE;
DROP TABLE IF EXISTS cashflow_days CASCADE;
DROP TABLE IF EXISTS cashflow_settings CASCADE;
DROP TABLE IF EXISTS cashflow_months CASCADE;

-- Step 2: Recreate tables with correct schema
CREATE TABLE cashflow_settings (
    id SERIAL PRIMARY KEY,
    "defaultDailySales" DECIMAL(10,2) DEFAULT 6000,
    "safetyThreshold" DECIMAL(10,2) DEFAULT 2000,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cashflow_days (
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

CREATE TABLE cashflow_payments (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    "recipientName" VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    "cashFlowDayId" INTEGER REFERENCES cashflow_days(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Insert default settings
INSERT INTO cashflow_settings ("defaultDailySales", "safetyThreshold")
VALUES (6000, 2000);

-- Verify tables created successfully
SELECT 'Tables created successfully!' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'cashflow%';
