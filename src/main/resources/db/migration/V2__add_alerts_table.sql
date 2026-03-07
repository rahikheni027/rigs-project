-- V2__add_alerts_table.sql

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- OFFLINE, MAINTENANCE, OVERHEAT
    severity VARCHAR(50) NOT NULL, -- LOW, MEDIUM, CRITICAL
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by BIGINT,
    CONSTRAINT fk_alert_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_user FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);
