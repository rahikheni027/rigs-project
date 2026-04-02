package com.rigs.rigs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rigs.rigs.dto.MachineTelemetryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class SseService {

    // Thread-safe list of active browser connections
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper;

    /**
     * Creates a new Server-Sent Events connection for a client.
     */
    public SseEmitter createConnection() {
        // Timeout set to 0 (infinite) so the connection stays open.
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        // Send heartbeat/connected event immediately to confirm link
        try {
            emitter.send(SseEmitter.event().name("connect").data("linked"));
        } catch (IOException e) {
            log.error("Failed to send initial connect event", e);
            emitters.remove(emitter);
            return emitter;
        }

        emitter.onCompletion(() -> {
            log.debug("SSE Connection completed cleanly.");
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE Connection timed out.");
            emitter.complete();
            emitters.remove(emitter);
        });

        emitter.onError((e) -> {
            log.debug("SSE Connection encountered an error.", e);
            emitter.completeWithError(e);
            emitters.remove(emitter);
        });

        return emitter;
    }

    /**
     * Blasts a new telemetry state to all connected frontends instantly.
     */
    public void broadcastTelemetry(MachineTelemetryResponse telemetry) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(telemetry);
        } catch (Exception e) {
            log.error("Failed to serialize telemetry for SSE: {}", e.getMessage());
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("telemetry")
                        .data(payload));
            } catch (IOException e) {
                // The client disconnected unexpectedly
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }

    /**
     * Blasts a new alert event to all connected frontends instantly.
     */
    public void broadcastAlert(Object alertData) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(alertData);
        } catch (Exception e) {
            log.error("Failed to serialize alert for SSE: {}", e.getMessage());
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("alert")
                        .data(payload));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }
}
