# Fix CashFlow Database Issue

The backend is failing because of a unique constraint conflict on the cashflow_days table.

## Solution: Run these SQL commands in your PostgreSQL database

### Option 1: Using pgAdmin or any PostgreSQL client

Connect to your `alaml` database and run:

```sql
-- Drop cashflow tables in correct order
DROP TABLE IF EXISTS cashflow_payments CASCADE;
DROP TABLE IF EXISTS cashflow_days CASCADE;
DROP TABLE IF EXISTS cashflow_settings CASCADE;
```

### Option 2: Using command line (if PostgreSQL is in PATH)

```bash
# Windows PowerShell
$env:PGPASSWORD="your_password"; psql -U alaml_user -d alaml -c "DROP TABLE IF EXISTS cashflow_payments CASCADE; DROP TABLE IF EXISTS cashflow_days CASCADE; DROP TABLE IF EXISTS cashflow_settings CASCADE;"
```

### Option 3: Temporary fix - Disable synchronize

If you can't access the database right now, you can temporarily disable auto-sync:

1. Open `backend/src/app.module.ts`
2. Change `synchronize: true` to `synchronize: false` (line 45)
3. Restart the backend
4. Then manually create the tables using the SQL below

## After clearing the tables

The backend will automatically recreate them when you restart with `npm run start:dev`

## Manual table creation (if needed)

```sql
-- Create cashflow_settings table
CREATE TABLE cashflow_settings (
    id SERIAL PRIMARY KEY,
    "defaultDailySales" DECIMAL(10,2) DEFAULT 6000,
    "safetyThreshold" DECIMAL(10,2) DEFAULT 2000,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cashflow_days table
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

-- Create cashflow_payments table
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
```
