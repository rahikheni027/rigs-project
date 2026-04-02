-- V5__add_machine_dependencies.sql
-- Phase 4: Dependency-aware machine control system

CREATE TABLE IF NOT EXISTS machine_dependencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_machine_id BIGINT NOT NULL,
    child_machine_id BIGINT NOT NULL,
    dependency_type VARCHAR(50) DEFAULT 'PROCESS_FLOW',
    propagate_stop BOOLEAN DEFAULT TRUE,
    propagate_emergency BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_parent_child (parent_machine_id, child_machine_id),
    CONSTRAINT fk_dep_parent FOREIGN KEY (parent_machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    CONSTRAINT fk_dep_child FOREIGN KEY (child_machine_id) REFERENCES machines(id) ON DELETE CASCADE
);


-- Seed default process flow dependencies within same process units
-- Unit A chain: Machine 1 → Machine 4 → Machine 7
INSERT IGNORE INTO machine_dependencies (parent_machine_id, child_machine_id, dependency_type) VALUES (1, 4, 'PROCESS_FLOW');
INSERT IGNORE INTO machine_dependencies (parent_machine_id, child_machine_id, dependency_type) VALUES (4, 7, 'PROCESS_FLOW');

-- Unit B chain: Machine 2 → Machine 5 → Machine 8
INSERT IGNORE INTO machine_dependencies (parent_machine_id, child_machine_id, dependency_type) VALUES (2, 5, 'PROCESS_FLOW');
INSERT IGNORE INTO machine_dependencies (parent_machine_id, child_machine_id, dependency_type) VALUES (5, 8, 'PROCESS_FLOW');

-- Unit C chain: Machine 3 → Machine 6
INSERT IGNORE INTO machine_dependencies (parent_machine_id, child_machine_id, dependency_type) VALUES (3, 6, 'PROCESS_FLOW');
