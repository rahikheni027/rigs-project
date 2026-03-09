import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Zap, Wifi, WifiOff, Clock } from 'lucide-react';
import api from '../api/axios';

const Layout = () => {
    const { user, loading } = useAuth();
    const [connected, setConnected] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Periodically check backend connectivity
    useEffect(() => {
        const checkConnection = async () => {
            try {
                await api.get('/machines');
                setConnected(true);
                setLastRefresh(new Date());
            } catch (e) {
                setConnected(false);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 2s infinite' }}>
                    <Zap size={26} color="#38bdf8" />
                </div>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Initializing R.I.G.S.</p>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    return (
        <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Navbar />
            <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
                <Outlet />
            </main>

            {/* Connection Status Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.04)',
                padding: '10px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                fontSize: 11, color: '#4b5563', fontFamily: 'Inter, system-ui, sans-serif',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {connected ? (
                        <>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
                                boxShadow: '0 0 8px rgba(74,222,128,0.5)',
                                animation: 'pulse 3s infinite',
                            }} />
                            <Wifi size={12} color="#4ade80" />
                            <span style={{ color: '#6b7280' }}>Connected</span>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%', background: '#f87171',
                                boxShadow: '0 0 8px rgba(248,113,113,0.5)',
                                animation: 'pulse 1.5s infinite',
                            }} />
                            <WifiOff size={12} color="#f87171" />
                            <span style={{ color: '#f87171' }}>Disconnected</span>
                        </>
                    )}
                </div>
                <span style={{ color: '#374151' }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={11} color="#4b5563" />
                    <span>Last sync: {lastRefresh.toLocaleTimeString()}</span>
                </div>
                <span style={{ color: '#374151' }}>·</span>
                <span>R.I.G.S. v2.0</span>
            </footer>
        </div>
    );
};

export default Layout;
