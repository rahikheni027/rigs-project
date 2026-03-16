"""
R.I.G.S. Virtual Industrial Machine
Simulates a real ESP32 retrofit machine with telemetry, commands, and failure scenarios.
"""

import json
import logging
import random
import threading
import time

logger = logging.getLogger(__name__)


class Machine:
    """
    Represents a single virtual industrial machine.
    Maintains independent state, generates telemetry, handles commands,
    and simulates failures and predictive maintenance conditions.
    """

    def __init__(self, machine_id, mqtt_client, config):
        self.machine_id = machine_id
        self.mqtt_client = mqtt_client
        self.config = config

        # Machine state
        self.status = "RUNNING"
        self.runtime_hours = 0.0
        self.lock = threading.Lock()

        # Configuration
        self.interval = config.get("interval", 5)
        self.maintenance_threshold = config.get("maintenance_threshold", 100.0)
        self.failure_overheat_prob = config.get("failure_overheat_probability", 0.05)
        self.failure_vibration_prob = config.get("failure_vibration_probability", 0.03)
        self.failure_offline_prob = config.get("failure_offline_probability", 0.02)

        # MQTT topics
        self.telemetry_topic = f"rigs/data/{self.machine_id}"
        self.ack_topic = f"rigs/ack/{self.machine_id}"
        self.command_topic = f"rigs/command/{self.machine_id}"

        # Control
        self._running = False
        self._thread = None
        self._offline_until = 0  # Unix timestamp until which machine simulates offline

        logger.info("Machine %s initialized (status=%s)", self.machine_id, self.status)

    def start_simulation(self):
        """Start the telemetry publishing loop in a background thread."""
        self._running = True
        self._thread = threading.Thread(
            target=self._telemetry_loop,
            name=f"machine-{self.machine_id}",
            daemon=True
        )
        self._thread.start()
        logger.info("Machine %s simulation started", self.machine_id)

    def stop_simulation(self):
        """Stop the telemetry publishing loop."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=self.interval + 2)
        logger.info("Machine %s simulation stopped", self.machine_id)

    def _telemetry_loop(self):
        """Main loop: generate and publish telemetry every interval seconds."""
        while self._running:
            try:
                # Check if simulating offline
                if time.time() < self._offline_until:
                    logger.debug("Machine %s is offline (simulated), skipping telemetry", self.machine_id)
                    time.sleep(1)
                    continue

                telemetry = self._generate_telemetry()
                payload = json.dumps(telemetry)

                result = self.mqtt_client.publish(self.telemetry_topic, payload, qos=1)
                if result.rc == 0:
                    logger.debug("Machine %s telemetry published: temp=%.1f, vib=%.2f, cur=%.1f, status=%s",
                                 self.machine_id, telemetry["temperature"],
                                 telemetry["vibration"], telemetry["current"],
                                 telemetry["status"])
                else:
                    logger.warning("Machine %s failed to publish telemetry (rc=%d)", self.machine_id, result.rc)

            except Exception as e:
                logger.error("Machine %s telemetry error: %s", self.machine_id, e)

            time.sleep(self.interval)

    def _generate_telemetry(self):
        """Generate a telemetry payload based on current machine state."""
        with self.lock:
            temperature, vibration, current = self._generate_sensor_readings()

            # Simulate failures
            temperature, vibration = self._simulate_failures(temperature, vibration)

            # Simulate predictive maintenance degradation
            vibration = self._simulate_maintenance(vibration)

            # Generate extended metrics
            rpm, pressure, power, efficiency, error_rate = self._generate_extended_metrics(temperature)

            # Accumulate runtime
            if self.status == "RUNNING":
                self.runtime_hours += self.interval / 3600.0

            return {
                "machineId": self.machine_id,
                "temperature": round(temperature, 2),
                "vibration": round(vibration, 3),
                "current": round(current, 2),
                "rpm": round(rpm, 1),
                "pressure": round(pressure, 2),
                "power": round(power, 2),
                "efficiency": round(efficiency, 1),
                "errorRate": round(error_rate, 3),
                "status": self.status,
                "runtimeHours": round(self.runtime_hours, 4),
                "heartbeat": True,
                "timestamp": int(time.time())
            }

    def _generate_extended_metrics(self, temperature):
        """Generate RPM, pressure, power consumption, efficiency, and error rate."""
        if self.status == "RUNNING":
            rpm = random.uniform(800, 3600)
            pressure = random.uniform(15, 120)
            # Higher RPM = more power consumption
            power = (rpm / 3600) * random.uniform(8, 25)
            efficiency = random.uniform(75, 99) - (temperature - 60) * 0.1
            efficiency = max(60, min(99.5, efficiency))
            error_rate = random.uniform(0, 0.05)
            if temperature > 85:
                error_rate += random.uniform(0.02, 0.08)
        elif self.status == "MAINTENANCE":
            rpm = 0
            pressure = random.uniform(5, 15)
            power = random.uniform(0.3, 1.0)
            efficiency = 0
            error_rate = 0
        elif self.status == "CALIBRATING":
            rpm = random.uniform(400, 800)
            pressure = random.uniform(10, 30)
            power = random.uniform(1.0, 3.0)
            efficiency = random.uniform(90, 99)
            error_rate = 0
        else:  # STOPPED, EMERGENCY, OFFLINE
            rpm = 0
            pressure = random.uniform(0, 5)
            power = random.uniform(0.0, 0.3)
            efficiency = 0
            error_rate = 0
        return rpm, pressure, power, efficiency, error_rate

    def _generate_sensor_readings(self):
        """Generate base sensor readings based on machine status."""
        if self.status == "RUNNING":
            temperature = random.uniform(40.0, 90.0)
            vibration = random.uniform(0.2, 5.0)
            current = random.uniform(2.0, 15.0)
        else:
            temperature = random.uniform(25.0, 35.0)
            vibration = random.uniform(0.0, 0.3)
            current = random.uniform(0.0, 0.5)

        return temperature, vibration, current

    def _simulate_failures(self, temperature, vibration):
        """Randomly inject failure conditions."""
        # 5% chance of overheating
        if random.random() < self.failure_overheat_prob:
            temperature = random.uniform(110.0, 140.0)
            logger.warning("🔥 Machine %s OVERHEATING: %.1f°C", self.machine_id, temperature)

        # 3% chance of vibration spike
        if random.random() < self.failure_vibration_prob:
            vibration = random.uniform(8.0, 12.0)
            logger.warning("📳 Machine %s VIBRATION SPIKE: %.2f g", self.machine_id, vibration)

        # 2% chance of going offline
        if random.random() < self.failure_offline_prob:
            offline_duration = 20  # seconds
            self._offline_until = time.time() + offline_duration
            logger.warning("📡 Machine %s going OFFLINE for %d seconds", self.machine_id, offline_duration)

        return temperature, vibration

    def _simulate_maintenance(self, vibration):
        """Simulate predictive maintenance degradation when runtime exceeds threshold."""
        if self.status == "RUNNING" and self.runtime_hours > self.maintenance_threshold:
            # Gradually increase vibration
            degradation = (self.runtime_hours - self.maintenance_threshold) * 0.02
            vibration += degradation

            # Occasional spike > 6.0
            if random.random() < 0.15:
                vibration = random.uniform(6.0, 9.0)
                logger.warning("⚠️ Machine %s maintenance vibration spike: %.2f g (runtime: %.1f hrs)",
                               self.machine_id, vibration, self.runtime_hours)

        return vibration

    def handle_command(self, payload):
        """Process an incoming command."""
        try:
            data = json.loads(payload)
            command = data.get("command", "").upper()

            valid_commands = {
                "START": "RUNNING",
                "STOP": "STOPPED",
                "EMERGENCY_STOP": "EMERGENCY",
                "RESET": "STOPPED",
                "MAINTENANCE_MODE": "MAINTENANCE",
                "CALIBRATION": "CALIBRATING",
            }

            if command not in valid_commands:
                logger.warning("Machine %s received unknown command: %s", self.machine_id, command)
                return

            with self.lock:
                old_status = self.status
                self.status = valid_commands[command]
                logger.info("Machine %s command received: %s (status: %s → %s)",
                            self.machine_id, command, old_status, self.status)

            # Send acknowledgment
            self._send_ack()

        except json.JSONDecodeError:
            logger.error("Machine %s received malformed command: %s", self.machine_id, payload)
        except Exception as e:
            logger.error("Machine %s command handling error: %s", self.machine_id, e)

    def _send_ack(self):
        """Publish acknowledgment message."""
        ack = {
            "machineId": self.machine_id,
            "status": self.status,
            "timestamp": int(time.time())
        }
        payload = json.dumps(ack)
        result = self.mqtt_client.publish(self.ack_topic, payload, qos=1)

        if result.rc == 0:
            logger.info("Machine %s ACK sent: status=%s", self.machine_id, self.status)
        else:
            logger.warning("Machine %s failed to send ACK (rc=%d)", self.machine_id, result.rc)
