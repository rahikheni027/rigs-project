package com.rigs.rigs.service;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.repository.MachineRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttListenerService implements MqttCallbackExtended {

    @Value("${mqtt.broker.url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${mqtt.client.id:rigs-backend}")
    private String clientId;

    private MqttClient mqttClient;
    private final MachineService machineService;
    private final MachineRepository machineRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        connectToBroker();
    }

    private void connectToBroker() {
        try {
            mqttClient = new MqttClient(brokerUrl, clientId + "-" + System.currentTimeMillis(),
                    new MemoryPersistence());
            mqttClient.setCallback(this);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            mqttClient.connect(options);
        } catch (MqttException e) {
            log.error("❌ MQTT Connection Error: {}", e.getMessage());
        }
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("✅ MQTT broker: {}", serverURI);
        try {
            mqttClient.subscribe("rigs/data/#", 1);
            mqttClient.subscribe("rigs/ack/#", 1);
        } catch (MqttException e) {
            log.error("Subscription failed: {}", e.getMessage());
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload());
        if (topic.startsWith("rigs/data/"))
            handleTelemetry(topic, payload);
    }

    private void handleTelemetry(String topic, String payload) {
        try {
            JsonNode data = objectMapper.readTree(payload);
            String machineIdStr = data.has("machineId") ? data.get("machineId").asText() : null;
            if (machineIdStr == null)
                return;

            Long machineId = Long.parseLong(machineIdStr);
            Double temperature = data.has("temperature") ? data.get("temperature").asDouble() : null;
            Double vibration = data.has("vibration") ? data.get("vibration").asDouble() : null;
            Double currentDraw = data.has("current") ? data.get("current").asDouble() : null;
            String status = data.has("status") ? data.get("status").asText() : "RUNNING";
            Double rpm = data.has("rpm") ? data.get("rpm").asDouble() : null;
            Double pressure = data.has("pressure") ? data.get("pressure").asDouble() : null;
            Double powerConsumption = data.has("power") ? data.get("power").asDouble() : null;
            Double efficiency = data.has("efficiency") ? data.get("efficiency").asDouble() : null;
            Double errorRate = data.has("errorRate") ? data.get("errorRate").asDouble() : null;

            machineService.saveTelemetry(machineId, temperature, vibration, currentDraw, status,
                    rpm, pressure, powerConsumption, efficiency, errorRate);
        } catch (Exception e) {
            log.error("Telemetry error: {}", e.getMessage());
        }
    }

    public void sendCommand(Long machineId, String command) {
        try {
            String topic = "rigs/command/" + machineId;
            String payload = String.format("{\"command\":\"%s\"}", command);
            mqttClient.publish(topic, new MqttMessage(payload.getBytes()));
        } catch (MqttException e) {
            log.error("Command send error: {}", e.getMessage());
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT Lost: {}", cause.getMessage());
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (mqttClient != null)
                mqttClient.disconnect();
        } catch (MqttException ignored) {
        }
    }
}
