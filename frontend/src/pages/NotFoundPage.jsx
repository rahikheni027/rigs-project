import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Home, LayoutDashboard, AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#030712', fontFamily: 'Inter, system-ui, sans-serif', padding: 24,
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Background glows */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: 500, height: 500, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(239,68,68,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '60%', left: '60%', width: 400, height: 400, borderRadius: '50%', filter: 'blur(100px)', background: 'rgba(14,165,233,0.05)', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 500 }}
            >
                {/* Icon */}
                <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    style={{
                        display: 'inline-flex', width: 80, height: 80, borderRadius: 24,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 28,
                    }}
                >
                    <AlertTriangle size={36} color="#f87171" />
                </motion.div>

                {/* 404 number */}
                <h1 style={{
                    fontSize: 'clamp(80px, 15vw, 140px)', fontWeight: 900, lineHeight: 1,
                    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #6366f1 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    margin: '0 0 8px', letterSpacing: '-4px',
                }}>
                    404
                </h1>

                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f9fafb', marginBottom: 12, letterSpacing: '-0.5px' }}>
                    Page Not Found
                </h2>
                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 36 }}>
                    The page you're looking for doesn't exist or has been moved.<br />
                    Let's get you back to monitoring your machines.
                </p>

                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                        to="/"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 12,
                            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white',
                            textDecoration: 'none', fontSize: 14, fontWeight: 700,
                            boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Home size={16} /> Go Home
                    </Link>
                    <Link
                        to="/app/dashboard"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)', color: '#e5e7eb',
                            border: '1px solid rgba(255,255,255,0.12)',
                            textDecoration: 'none', fontSize: 14, fontWeight: 600,
                            transition: 'all 0.2s',
                        }}
                    >
                        <LayoutDashboard size={16} /> Dashboard
                    </Link>
                </div>

                {/* Bottom branding */}
                <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', borderRadius: 8, padding: 5 }}>
                        <Zap size={14} color="white" />
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 13, color: '#4b5563' }}>R.I.G.S.</span>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
