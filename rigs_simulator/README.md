# R.I.G.S. Python Virtual Machine Simulator

A Python-based MQTT simulator that generates realistic telemetry data for virtual industrial machines. It connects to your MQTT broker and publishes data on the same topics the R.I.G.S. backend subscribes to.

---

## Quick Start

### Prerequisites

| Requirement | How to Install |
|---|---|
| Python 3.8+ | `sudo apt install python3` |
| pip | `sudo apt install python3-pip` |
| Mosquitto Broker | `sudo apt install mosquitto` |

### Step 1 — Install Dependencies

```bash
cd rigs_simulator
pip install -r requirements.txt
```

This installs `paho-mqtt`, the MQTT client library.

### Step 2 — Start Mosquitto Broker

```bash
# Start the broker
sudo systemctl start mosquitto

# Verify it's running
sudo systemctl status mosquitto
```

If Mosquitto is not installed:
```bash
sudo apt update && sudo apt install mosquitto mosquitto-clients -y
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

### Step 3 — Start the Simulator

```bash
# Default: 3 machines, 5-second interval, localhost broker
python3 simulator.py

# Custom: 5 machines, 3-second interval
python3 simulator.py --machines 5 --interval 3

# Custom broker
python3 simulator.py --broker 192.168.1.100 --port 1883

# Run in background
nohup python3 simulator.py --machines 5 --interval 3 > simulator.log 2>&1 &
```

### Step 4 — Start the Spring Boot Backend

```bash
cd /home/krish/PROJECT1/rigs
./mvnw spring-boot:run
```

> **Note:** Requires JDK 21. Install with: `sudo apt install openjdk-21-jdk-headless`

---

## MQTT Topic Structure

The simulator publishes/subscribes to these exact topics that match the R.I.G.S. backend:

| Direction | Topic | Purpose |
|---|---|---|
| **Simulator → Backend** | `rigs/data/{machineId}` | Telemetry data (temp, vibration, current) |
| **Backend → Simulator** | `rigs/command/{machineId}` | Commands (START, STOP, CONFIGURE) |
| **Simulator → Backend** | `rigs/ack/{machineId}` | Command acknowledgment |

### Telemetry Message Format (Published every interval)

```json
{
    "machineId": 1,
    "machineName": "CNC-Machine-001",
    "status": "RUNNING",
    "temperature": 72.45,
    "vibration": 1.23,
    "currentDraw": 45.67,
    "cumulativeRuntimeHours": 1234.56,
    "location": "Floor-A Bay-3",
    "timestamp": "2026-02-20T21:00:00"
}
```

### Command Message Format (Received from backend)

```json
{
    "command": "STOP",
    "parameters": {}
}
```

### Acknowledgment Message Format (Published after command)

```json
{
    "machineId": 1,
    "command": "STOP",
    "status": "ACKNOWLEDGED",
    "timestamp": "2026-02-20T21:00:05"
}
```

---

## Console Output

When running, you will see:

```
[INFO] Connecting to MQTT broker at localhost:1883...
[INFO] Connected to MQTT broker successfully
[INFO] Subscribed to command topics for 3 machines
[INFO] [CNC-Machine-001] Telemetry sent: RUNNING temp=72.45°C vib=1.23g
[INFO] [CNC-Machine-002] Telemetry sent: STOPPED temp=25.10°C vib=0.05g
[INFO] [CNC-Machine-003] Telemetry sent: RUNNING temp=68.90°C vib=0.98g
[INFO] [CNC-Machine-001] Received command: STOP
[INFO] [CNC-Machine-001] ACK sent for STOP
```

---

## Simulation Features

- **Realistic telemetry**: Temperature, vibration, and current draw vary based on machine state
- **Failure simulation**: Random overheat (5%), excessive vibration (3%), offline events (2%)
- **Maintenance degradation**: Performance slowly degrades over runtime hours
- **Auto-reconnect**: Automatically reconnects if the MQTT broker becomes unavailable
- **Graceful shutdown**: Press `Ctrl+C` to stop cleanly

---

## Configuration

Edit `config.json` to customize defaults:

```json
{
    "broker": "localhost",
    "port": 1883,
    "machine_count": 3,
    "publish_interval": 5,
    "failure_probabilities": {
        "overheat": 0.05,
        "vibration": 0.03,
        "offline": 0.02
    }
}
```

---

## Complete Startup Sequence

Run these commands in order:

```bash
# Terminal 1: Start Mosquitto
sudo systemctl start mosquitto

# Terminal 2: Start Simulator
cd /home/krish/PROJECT1/rigs/rigs_simulator
pip install -r requirements.txt
python3 simulator.py --machines 5 --interval 3

# Terminal 3: Start Spring Boot
cd /home/krish/PROJECT1/rigs
./mvnw spring-boot:run

# Open browser
# http://localhost:8080
```
