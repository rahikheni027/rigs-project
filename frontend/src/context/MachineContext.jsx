import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    // Dismiss cascading failure banner
    const dismissCascadingFailure = useCallback(() => setCascadingFailure(null), []);

    // Clear a specific live alert
    const dismissAlert = useCallback((index) => {
        setLiveAlerts(prev => prev.filter((_, i) => i !== index));
    }, []);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const eventSource = new EventSource(`${apiUrl}/machines/stream?token=${token}`);

        eventSource.onopen = () => {
            console.log("SSE Connection Opened");
            setIsOnline(true);
        };

        eventSource.onerror = (error) => {
            console.error("SSE Connection Error", error);
            setIsOnline(false);
        };

        eventSource.addEventListener('telemetry', (event) => {
            if (!event.data) return;
            try {
                const incomingTelemetry = JSON.parse(event.data);
                
                setMachines(prevMachines => {
                    // Check if machine already exists in state
                    const exists = prevMachines.some(m => m.machineId === incomingTelemetry.machineId);
                    
                    if (exists) {
                        return prevMachines.map(m => 
                            m.machineId === incomingTelemetry.machineId ? incomingTelemetry : m
                        );
                    } else {
                        // Brand new machine arrived
                        return [...prevMachines, incomingTelemetry];
                    }
                });
                
                setDataPoints(p => p + 1);
                setLastSync(new Date());
            } catch (e) {
                console.error("Failed to parse incoming telemetry SSE", e);
            }
        });

        // Phase 3: Listen for real-time alert events from the AlertEngine
        eventSource.addEventListener('alert', (event) => {
            if (!event.data) return;
            try {
                const alertData = JSON.parse(event.data);
                console.log("🚨 SSE Alert received:", alertData);

                // Handle cascading failure specially — show dramatic banner
                if (alertData.type === 'CASCADING_FAILURE') {
                    setCascadingFailure(alertData);
                    // Auto-dismiss after 30 seconds
                    setTimeout(() => setCascadingFailure(null), 30000);
                }

                // Add to live alerts (keep last 20)
                setLiveAlerts(prev => {
                    const next = [{ ...alertData, receivedAt: new Date().toISOString() }, ...prev];
                    return next.slice(0, 20);
                });
            } catch (e) {
                console.error("Failed to parse alert SSE", e);
            }
        });

        return () => {
            console.log("Closing SSE Connection");
            eventSource.close();
            setIsOnline(false);
        };
    }, [user]);

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

    return (
        <MachineContext.Provider value={{
            machines, setMachines, isOnline, dataPoints, lastSync,
            liveAlerts, cascadingFailure, dismissCascadingFailure, dismissAlert,
            dependencyGraph, setDependencyGraph
        }}>
            {children}
        </MachineContext.Provider>
    );
};
