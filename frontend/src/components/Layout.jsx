import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Zap, Wifi, WifiOff, Clock, Radio, Database, Server, Shield } from 'lucide-react';
import api from '../api/axios';

const Layout = () => {
    const { user, loading } = useAuth();
    const [connected, setConnected] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [dataPoints, setDataPoints] = useState(0);
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const uptimeTimer = setInterval(() => {
            setUptime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(uptimeTimer);
    }, []);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                await api.get('/machines');
                setConnected(true);
                setLastRefresh(new Date());
                setDataPoints(p => p + 1);
            } catch (e) {
                setConnected(false);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 15000);
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(14, 165, 233, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    animation: 'pulse 2s infinite',
                }}>
                    <Zap size={26} color="#0ea5e9" />
                </div>
                <p style={{ color: '#64748b', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>INITIALIZING SCADA INTERFACE...</p>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="scada-scanline scada-grid-bg" style={{ minHeight: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Navbar />
            <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 20px' }}>
                <Outlet />
            </main>

            {/* SCADA Status Bar Footer */}
            <footer style={{
                borderTop: '1px solid rgba(14, 165, 233, 0.08)',
                padding: '6px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 10, color: '#475569',
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(2, 6, 23, 0.95)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Connection Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {connected ? (
                            <>
                                <div style={{
                                    width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                                    boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                                    animation: 'pulse 3s infinite',
                                }} />
                                <Wifi size={10} color="#22c55e" />
                                <span style={{ color: '#4ade80' }}>CONNECTED</span>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
                                    boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                                    animation: 'alarm-flash 1s infinite',
                                }} />
                                <WifiOff size={10} color="#ef4444" />
                                <span style={{ color: '#f87171' }}>DISCONNECTED</span>
                            </>
                        )}
                    </div>

                    <span style={{ color: '#1e293b' }}>│</span>

                    {/* Data Rate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Database size={10} color="#0ea5e9" />
                        <span>DATA POINTS: {dataPoints}</span>
                    </div>

                    <span style={{ color: '#1e293b' }}>│</span>

                    {/* Protocol */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Radio size={10} color="#0ea5e9" />
                        <span>MQTT/TLS · POLL 15s</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Last Sync */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} color="#475569" />
                        <span>SYNC: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                    </div>

                    <span style={{ color: '#1e293b' }}>│</span>

                    {/* Session Uptime */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Server size={10} color="#475569" />
                        <span>SESSION: {formatUptime(uptime)}</span>
                    </div>

                    <span style={{ color: '#1e293b' }}>│</span>

                    {/* System ID */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Shield size={10} color="#475569" />
                        <span>R.I.G.S. SCADA v3.0.0</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
