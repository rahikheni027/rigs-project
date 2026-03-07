package com.rigs.rigs.config;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineTelemetry;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.repository.MachineRepository;
import com.rigs.rigs.repository.MachineTelemetryRepository;
import com.rigs.rigs.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initData(MachineRepository machineRepository,
            MachineTelemetryRepository telemetryRepository,
            UserRepository userRepository,
            com.rigs.rigs.repository.MachineSettingsRepository settingsRepository,
            com.rigs.rigs.repository.AuditLogRepository auditLogRepository,
            com.rigs.rigs.repository.CommandRepository commandRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        return args -> {

            // ===== ADMIN ACCOUNT =====
            var existingAdmin = userRepository.findByEmail("admin@rigs.com");
            if (existingAdmin.isPresent()) {
                User admin = existingAdmin.get();
                admin.setAccountLocked(false);
                admin.setFailedAttempts(0);
                admin.setEnabled(1);
                admin.setRole("ADMIN");
                admin.setProvider("LOCAL");
                admin.setPassword(passwordEncoder.encode("Password@123"));
                userRepository.save(admin);
                log.info("✅ Admin account fixed: admin@rigs.com / Password@123");
            } else {
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail("admin@rigs.com");
                admin.setPassword(passwordEncoder.encode("Password@123"));
                admin.setRole("ADMIN");
                admin.setEnabled(1);
                admin.setActive(1);
                admin.setProvider("LOCAL");
                admin.setAccountLocked(false);
                admin.setFailedAttempts(0);
                admin.setTwoFactorEnabled(false);
                admin.setCreatedAt(LocalDateTime.now());
                userRepository.save(admin);
                log.info("✅ Created admin account: admin@rigs.com / Password@123");
            }

            // ===== ALWAYS RESET MACHINES TO EXACTLY 20 WITH IDs 1-20 =====
            log.info("Resetting machines to IDs 1-20...");

            // 1. Delete all child records first (foreign key order)
            telemetryRepository.deleteAll();
            settingsRepository.deleteAll();
            auditLogRepository.deleteAll();
            commandRepository.deleteAll();
            machineRepository.deleteAll();

            // 2. Reset auto_increment so IDs start from 1
            jdbcTemplate.execute("ALTER TABLE machines AUTO_INCREMENT = 1");
            jdbcTemplate.execute("ALTER TABLE machine_telemetry AUTO_INCREMENT = 1");

            String[][] machineData = {
                    { "CNC-Lathe-001", "Floor-A, Bay-1", "RUNNING", "45.2", "false" },
                    { "CNC-Mill-002", "Floor-A, Bay-2", "RUNNING", "87.5", "false" },
                    { "Hydraulic-Press-003", "Floor-A, Bay-3", "STOPPED", "120.8", "false" },
                    { "Welding-Robot-004", "Floor-A, Bay-4", "RUNNING", "63.1", "false" },
                    { "Assembly-Line-005", "Floor-B, Bay-1", "RUNNING", "210.4", "false" },
                    { "Conveyor-Belt-006", "Floor-B, Bay-2", "RUNNING", "156.3", "false" },
                    { "Injection-Mold-007", "Floor-B, Bay-3", "STOPPED", "89.6", "false" },
                    { "Drill-Press-008", "Floor-B, Bay-4", "RUNNING", "110.2", "false" },
                    { "Laser-Cutter-009", "Floor-C, Bay-1", "RUNNING", "75.8", "false" },
                    { "3D-Printer-010", "Floor-C, Bay-2", "STOPPED", "43.1", "false" },
                    { "Paint-Booth-011", "Floor-C, Bay-3", "RUNNING", "289.5", "false" },
                    { "Heat-Treat-Oven-012", "Floor-C, Bay-4", "RUNNING", "167.9", "false" },
                    { "Grinding-Machine-013", "Floor-D, Bay-1", "RUNNING", "94.3", "false" },
                    { "Plasma-Cutter-014", "Floor-D, Bay-2", "STOPPED", "123.7", "false" },
                    { "Water-Jet-015", "Floor-D, Bay-3", "RUNNING", "56.4", "false" },
                    { "EDM-Machine-016", "Floor-D, Bay-4", "RUNNING", "234.6", "false" },
                    { "Sheet-Metal-017", "Floor-E, Bay-1", "RUNNING", "345.2", "false" },
                    { "Packaging-Unit-018", "Floor-E, Bay-2", "RUNNING", "78.1", "false" },
                    { "Quality-Scanner-019", "Floor-E, Bay-3", "RUNNING", "156.8", "false" },
                    { "AGV-Transport-020", "Floor-E, Bay-4", "RUNNING", "210.3", "false" }
            };

            for (String[] md : machineData) {
                Machine m = new Machine();
                m.setName(md[0]);
                m.setLocation(md[1]);
                m.setStatus(md[2]);
                m.setCumulativeRuntimeHours(Double.parseDouble(md[3]));
                m.setMaintenanceAlert(Boolean.parseBoolean(md[4]));
                m.setLastHeartbeat(LocalDateTime.now());
                Machine saved = machineRepository.save(m);

                // Create initial telemetry for running machines
                if ("RUNNING".equals(md[2])) {
                    MachineTelemetry t = new MachineTelemetry();
                    t.setMachine(saved);
                    t.setTemperature(55 + Math.random() * 30);
                    t.setVibration(0.5 + Math.random() * 2.0);
                    t.setCurrentDraw(8 + Math.random() * 12);
                    t.setMachineStatus("RUNNING");
                    t.setTimestamp(LocalDateTime.now());
                    telemetryRepository.save(t);
                }
            }
            log.info("✅ Created 20 machines with IDs 1-20 and initial telemetry");
        };
    }
}
