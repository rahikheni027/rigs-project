-- V3__add_machine_type_columns.sql

-- Add machine type and process unit columns to machines table
ALTER TABLE machines ADD COLUMN IF NOT EXISTS machine_type VARCHAR(50) DEFAULT 'MOTOR';
ALTER TABLE machines ADD COLUMN IF NOT EXISTS process_unit VARCHAR(100) DEFAULT 'Unit A';

-- Add extended telemetry columns to machine_telemetry table (if not added by Hibernate)
ALTER TABLE machine_telemetry ADD COLUMN IF NOT EXISTS rpm DOUBLE;
ALTER TABLE machine_telemetry ADD COLUMN IF NOT EXISTS pressure DOUBLE;
ALTER TABLE machine_telemetry ADD COLUMN IF NOT EXISTS power_consumption DOUBLE;
ALTER TABLE machine_telemetry ADD COLUMN IF NOT EXISTS efficiency DOUBLE;
ALTER TABLE machine_telemetry ADD COLUMN IF NOT EXISTS error_rate DOUBLE;
