-- V3__add_database_indexes.sql
-- Optimizing queries for large telemetry ingestion and dashboard loads

-- 1. Index for fast telemetry queries (Dashboard charts querying by machine + time)
CREATE INDEX IF NOT EXISTS idx_telemetry_machine_time ON machine_telemetry (machine_id, timestamp DESC);

-- 2. Index for quick machine status checks (Admin/Worker Dashboard KPI queries)
CREATE INDEX IF NOT EXISTS idx_machine_status ON machines (status);

-- 3. Index for alert filtering (Finding unacknowledged critical alerts fast)
CREATE INDEX IF NOT EXISTS idx_alerts_machine_severity ON alerts (machine_id, severity);

-- 4. Index for command lookups (Checking PENDING commands)
CREATE INDEX IF NOT EXISTS idx_commands_machine_status ON commands (machine_id, status);
