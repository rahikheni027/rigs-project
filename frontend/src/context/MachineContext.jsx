import React, { createContext, useContext, useState, useEffect } from 'react';
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
                const res = await fetch(`${apiUrl}/machines`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMachines(data);
                }
            } catch (e) {
                console.error("Failed to fetch initial machines", e);
            }
        };
        fetchInitialState();
    }, [user]);

    return (
        <MachineContext.Provider value={{ machines, setMachines, isOnline, dataPoints, lastSync }}>
            {children}
        </MachineContext.Provider>
    );
};
