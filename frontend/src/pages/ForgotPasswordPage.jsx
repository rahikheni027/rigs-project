import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // For now, show success message — backend email integration needed later
        setSubmitted(true);
    };

    const S = {
        page: {
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#030712', fontFamily: 'Inter, system-ui, sans-serif', padding: 24,
            position: 'relative', overflow: 'hidden',
        },
        glow: (top, left, color) => ({
            position: 'absolute', borderRadius: '50%', filter: 'blur(100px)',
            background: color, pointerEvents: 'none', top, left, width: 500, height: 500,
        }),
        box: { width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 },
        card: {
            background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)',
        },
        label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 },
        input: {
            width: '100%', padding: '10px 16px 10px 42px', background: 'rgba(31,41,55,0.7)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f9fafb',
            fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box',
        },
        btn: {
            width: '100%', padding: '12px', marginTop: 8,
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(14,165,233,0.35)',
            transition: 'all 0.2s', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        },
    };

    return (
        <div style={S.page}>
            <div style={S.glow('10%', '20%', 'rgba(14,165,233,0.06)')} />
            <div style={S.glow('60%', '65%', 'rgba(99,102,241,0.05)')} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={S.box}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <motion.div
                        style={{
                            display: 'inline-flex', width: 64, height: 64, borderRadius: 20,
                            background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                            alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 50px rgba(14,165,233,0.4)', marginBottom: 16,
                        }}
                        animate={{ boxShadow: ['0 0 30px rgba(14,165,233,0.3)', '0 0 60px rgba(14,165,233,0.5)', '0 0 30px rgba(14,165,233,0.3)'] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    >
                        <Zap size={30} color="white" />
                    </motion.div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f9fafb', margin: 0, letterSpacing: '-0.5px' }}>
                        Reset Password
                    </h1>
                    <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
                        Enter your email and we'll help you get back in
                    </p>
                </div>

                <div style={S.card}>
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '20px 0' }}
                        >
                            <div style={{
                                width: 64, height: 64, borderRadius: 16,
                                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px',
                            }}>
                                <CheckCircle2 size={30} color="#4ade80" />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                                Check Your Email
                            </h3>
                            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
                                If an account exists for <span style={{ color: '#38bdf8', fontWeight: 600 }}>{email}</span>,
                                you'll receive password reset instructions shortly.
                            </p>
                            <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 20 }}>
                                This feature requires email service configuration. Please contact your administrator.
                            </p>
                            <Link
                                to="/login"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    color: '#38bdf8', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                }}
                            >
                                <ArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={S.label}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 14, top: 11, color: '#4b5563', pointerEvents: 'none' }} />
                                    <input
                                        type="email" value={email} required
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        style={S.input}
                                        onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                            </div>

                            <button type="submit" style={S.btn}>
                                <Send size={16} /> Send Reset Link
                            </button>

                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <Link
                                    to="/login"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        color: '#6b7280', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                    }}
                                >
                                    <ArrowLeft size={14} /> Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
