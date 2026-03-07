import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Zap } from 'lucide-react';

const Layout = () => {
    const { user, loading } = useAuth();

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
        </div>
    );
};

export default Layout;
