import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';

const MachineContext = createContext();

export const useMachines = () => {
    return useContext(MachineContext);
};

export const MachineProvider = ({ children }) => {
    const { user } = useAuth();
    const [machines, setMachines] = useState([]);
    const [isOnline, setIsOnline] = useState(false);
    const [dataPoints, setDataPoints] = useState(0);
    const [lastSync, setLastSync] = useState(new Date());
    const [liveAlerts, setLiveAlerts] = useState([]);
    const [cascadingFailure, setCascadingFailure] = useState(null);
    const [dependencyGraph, setDependencyGraph] = useState({ nodes: [], edges: [] });
    
    // Performance Optimization: Buffer incoming telemetry to prevent render-storms
    const telemetryBuffer = useRef({});
    const lastCommitRef = useRef(Date.now());

    // Dismiss cascading failure banner
    const dismissCascadingFailure = useCallback(() => setCascadingFailure(null), []);

    // Clear a specific live alert
    const dismissAlert = useCallback((index) => {
        setLiveAlerts(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Reconnection logic
    const [esInstance, setEsInstance] = useState(null);

    const connectSSE = useCallback(() => {
        if (!user) return;
        
        // Close existing if any
        if (esInstance) {
            esInstance.close();
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const eventSource = new EventSource(`${apiUrl}/machines/stream?token=${token}`);

        eventSource.onopen = () => {
            console.log("██ SSE Connection Opened");
            setIsOnline(true);
        };

        eventSource.onerror = (error) => {
            console.error("██ SSE Connection Error", error);
            setIsOnline(false);
            eventSource.close();
            // Auto-retry handled by useEffect or manual trigger
        };

        eventSource.addEventListener('connect', (event) => {
            console.log("██ SSE Link Verified:", event.data);
            setIsOnline(true);
        });

        eventSource.addEventListener('telemetry', (event) => {
            if (!event.data) return;
            try {
                const incoming = JSON.parse(event.data);
                // Buffer the update instead of setting state immediately
                telemetryBuffer.current[incoming.machineId] = incoming;
                setDataPoints(p => p + 1);
            } catch (e) {
                console.error("██ Failed to parse telemetry", e);
            }
        });

        eventSource.addEventListener('alert', (event) => {
            if (!event.data) return;
            try {
                const alertData = JSON.parse(event.data);
                if (alertData.type === 'CASCADING_FAILURE') {
                    setCascadingFailure(alertData);
                    setTimeout(() => setCascadingFailure(null), 30000);
                }
                setLiveAlerts(prev => {
                    const next = [{ ...alertData, receivedAt: new Date().toISOString() }, ...prev];
                    return next.slice(0, 20);
                });
            } catch (e) {
                console.error("██ Failed to parse alert", e);
            }
        });

        setEsInstance(eventSource);
    }, [user, esInstance]);

    useEffect(() => {
        if (!user) return;
        connectSSE();

        // Throttled Committer: Flush the buffer every 250ms
        const commitInterval = setInterval(() => {
            const updates = Object.values(telemetryBuffer.current);
            if (updates.length === 0) return;

            setMachines(prev => {
                const next = [...prev];
                updates.forEach(upd => {
                    const idx = next.findIndex(m => m.machineId === upd.machineId);
                    if (idx !== -1) {
                        next[idx] = upd;
                    } else {
                        next.push(upd);
                    }
                });
                return next;
            });

            // Clear buffer and update sync time
            telemetryBuffer.current = {};
            setLastSync(new Date());
        }, 250);

        return () => {
            if (esInstance) esInstance.close();
            clearInterval(commitInterval);
            setIsOnline(false);
        };
    }, [user, connectSSE]); // Added connectSSE to deps for safety

    // Initial fetch to populate machines before SSE brings updates
    useEffect(() => {
        if (!user) return;
        const fetchInitialState = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
                
                const [machinesRes, depsRes] = await Promise.all([
                    fetch(`${apiUrl}/machines`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/dependencies/graph`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                
                if (machinesRes.ok) {
                    const data = await machinesRes.json();
                    setMachines(data);
                }
                if (depsRes.ok) {
                    const data = await depsRes.json();
                    setDependencyGraph(data);
                }
            } catch (e) {
                console.error("Failed to fetch initial machines", e);
            }
        };
        fetchInitialState();
    }, [user]);

    const contextValue = useMemo(() => ({
        machines, 
        setMachines, 
        isOnline, 
        dataPoints, 
        lastSync,
        liveAlerts, 
        cascadingFailure, 
        dismissCascadingFailure, 
        dismissAlert,
        dependencyGraph, 
        setDependencyGraph, 
        reconnect: connectSSE
    }), [
        machines, isOnline, dataPoints, lastSync, liveAlerts, 
        cascadingFailure, dismissCascadingFailure, dismissAlert, 
        dependencyGraph, connectSSE
    ]);

    return (
        <MachineContext.Provider value={contextValue}>
            {children}
        </MachineContext.Provider>
    );
};
