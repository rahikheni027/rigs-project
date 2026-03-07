#!/usr/bin/env python3
"""
R.I.G.S. Virtual Industrial Machine Simulator
Simulates multiple ESP32 retrofit machines publishing telemetry via MQTT.

Usage:
    python simulator.py --machines 5 --broker localhost --port 1883 --interval 5
"""

import argparse
import json
import logging
import os
import signal
import sys
import time

import paho.mqtt.client as mqtt

from machine import Machine

# ===== LOGGING SETUP =====
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-7s] %(name)-20s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("rigs.simulator")


class RigsSimulator:
    """
    Orchestrates multiple virtual machines, manages MQTT connections,
    routes commands to the correct machine, and handles graceful shutdown.
    """

    def __init__(self, broker, port, num_machines, interval, config):
        self.broker = broker
        self.port = port
        self.num_machines = num_machines
        self.interval = interval
        self.config = config
        self.machines = {}
        self.client = None
        self._shutdown_event = False

    def start(self):
        """Initialize MQTT client, create machines, and start simulation."""
        logger.info("=" * 60)
        logger.info("  R.I.G.S. Virtual Machine Simulator")
        logger.info("  Broker: %s:%d", self.broker, self.port)
        logger.info("  Machines: %d", self.num_machines)
        logger.info("  Telemetry interval: %ds", self.interval)
        logger.info("=" * 60)

        # Setup MQTT client
        self.client = mqtt.Client(
            client_id=f"rigs_simulator_{os.getpid()}",
            protocol=mqtt.MQTTv311
        )
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)
        
        username = self.config.get("username")
        password = self.config.get("password")
        if username and password:
            self.client.username_pw_set(username, password)
            import ssl
            self.client.tls_set(tls_version=ssl.PROTOCOL_TLS)

        # Connect to broker
        logger.info("Connecting to MQTT broker %s:%d ...", self.broker, self.port)
        try:
            self.client.connect(self.broker, self.port, keepalive=60)
        except Exception as e:
            logger.error("Failed to connect to MQTT broker: %s", e)
            logger.info("Make sure Mosquitto is running: sudo systemctl start mosquitto")
            sys.exit(1)

        # Start network loop
        self.client.loop_start()

        # Create machines
        machine_config = {
            "interval": self.interval,
            "maintenance_threshold": self.config.get("maintenance_threshold", 100.0),
            "failure_overheat_probability": self.config.get("failure_overheat_probability", 0.05),
            "failure_vibration_probability": self.config.get("failure_vibration_probability", 0.03),
            "failure_offline_probability": self.config.get("failure_offline_probability", 0.02),
        }

        for i in range(1, self.num_machines + 1):
            machine_id = str(i)
            machine = Machine(machine_id, self.client, machine_config)
            self.machines[machine_id] = machine
            machine.start_simulation()

        logger.info("All %d machines started successfully", self.num_machines)

        # Wait for shutdown signal
        try:
            while not self._shutdown_event:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

        self.shutdown()

    def shutdown(self):
        """Gracefully stop all machines and disconnect MQTT."""
        if self._shutdown_event:
            return
        self._shutdown_event = True

        logger.info("Shutting down simulator...")

        # Stop all machines
        for machine_id, machine in self.machines.items():
            logger.info("Stopping machine %s ...", machine_id)
            machine.stop_simulation()

        # Disconnect MQTT
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()

        logger.info("Simulator shut down gracefully")

    # ===== MQTT CALLBACKS =====

    def _on_connect(self, client, userdata, flags, rc):
        """Called when MQTT connects (or reconnects)."""
        if rc == 0:
            logger.info("✅ Connected to MQTT broker")

            # Subscribe to command topics for all machines
            for machine_id in self.machines:
                topic = f"rigs/command/{machine_id}"
                client.subscribe(topic, qos=1)
                logger.info("Subscribed to %s", topic)
        else:
            logger.error("❌ MQTT connection failed with code %d", rc)

    def _on_disconnect(self, client, userdata, rc):
        """Called when MQTT disconnects."""
        if rc != 0:
            logger.warning("⚠️ Unexpected MQTT disconnect (rc=%d). Will auto-reconnect...", rc)
        else:
            logger.info("Disconnected from MQTT broker")

    def _on_message(self, client, userdata, msg):
        """Route incoming commands to the correct machine."""
        try:
            topic = msg.topic
            payload = msg.payload.decode("utf-8")

            logger.info("Message received on %s: %s", topic, payload)

            # Extract machine_id from topic: rigs/command/{machineId}
            parts = topic.split("/")
            if len(parts) >= 3 and parts[0] == "rigs" and parts[1] == "command":
                machine_id = parts[2]
                if machine_id in self.machines:
                    self.machines[machine_id].handle_command(payload)
                else:
                    logger.warning("Received command for unknown machine: %s", machine_id)
            else:
                logger.warning("Received message on unexpected topic: %s", topic)

        except Exception as e:
            logger.error("Error processing message: %s", e)


def load_config(config_path):
    """Load configuration from JSON file if available."""
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
            logger.info("Loaded config from %s", config_path)
            return config
        except Exception as e:
            logger.warning("Failed to load config file %s: %s", config_path, e)

    return {}


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="R.I.G.S. Virtual Industrial Machine Simulator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python simulator.py --machines 5
  python simulator.py --machines 10 --broker 192.168.1.100 --interval 3
  python simulator.py --machines 20 --port 1884

MQTT Topics:
  Telemetry:  rigs/data/{machineId}
  Commands:   rigs/command/{machineId}
  ACK:        rigs/ack/{machineId}
        """
    )
    parser.add_argument("--machines", type=int, default=3,
                        help="Number of virtual machines to simulate (default: 3)")
    parser.add_argument("--broker", type=str, default="localhost",
                        help="MQTT broker host (default: localhost)")
    parser.add_argument("--port", type=int, default=1883,
                        help="MQTT broker port (default: 1883)")
    parser.add_argument("--interval", type=int, default=5,
                        help="Telemetry publish interval in seconds (default: 5)")
    parser.add_argument("--config", type=str, default="config.json",
                        help="Path to config file (default: config.json)")

    return parser.parse_args()


def main():
    args = parse_args()

    # Load config
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), args.config)
    config = load_config(config_path)

    # CLI args override config
    broker = args.broker or config.get("broker", "localhost")
    port = args.port or config.get("port", 1883)
    num_machines = args.machines or config.get("machines", 3)
    interval = args.interval or config.get("interval", 5)

    # Create and start simulator
    simulator = RigsSimulator(broker, port, num_machines, interval, config)

    # Handle signals for graceful shutdown
    def signal_handler(signum, frame):
        logger.info("Received signal %d, initiating shutdown...", signum)
        simulator.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    simulator.start()


if __name__ == "__main__":
    main()
