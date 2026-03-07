import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { Zap, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match' });
            return;
        }
        if (formData.password.length < 8) {
            setStatus({ type: 'error', message: 'Password must be at least 8 characters' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            await api.post('/auth/signup', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            setStatus({ type: 'success', message: 'Registration successful! Your account is pending admin approval.' });
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Registration failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    const S = {
        page: {
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#030712', fontFamily: 'Inter, system-ui, sans-serif', padding: 24, position: 'relative',
            overflow: 'hidden',
        },
        glow: (top, left, color) => ({
            position: 'absolute', borderRadius: '50%', filter: 'blur(100px)',
            background: color, pointerEvents: 'none',
            top, left, width: 500, height: 500,
        }),
        box: { width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 },
        logoWrap: { textAlign: 'center', marginBottom: 32 },
        logoIcon: {
            display: 'inline-flex', width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 50px rgba(34,197,94,0.35)', marginBottom: 16,
        },
        h1: { fontSize: 28, fontWeight: 900, color: '#f9fafb', margin: 0, letterSpacing: '-0.5px' },
        sub: { fontSize: 14, color: '#6b7280', marginTop: 6 },
        card: {
            background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)',
        },
        alertBox: (type) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
            borderRadius: 10,
            color: type === 'error' ? '#f87171' : '#4ade80',
            fontSize: 13, marginBottom: 20,
        }),
        fieldWrap: { marginBottom: 16 },
        label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 },
        inputWrap: { position: 'relative' },
        icon: { position: 'absolute', left: 14, top: 11, color: '#4b5563', pointerEvents: 'none' },
        input: {
            width: '100%', padding: '10px 16px 10px 42px', background: 'rgba(31,41,55,0.7)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f9fafb',
            fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box',
        },
        submitBtn: {
            width: '100%', padding: '12px', marginTop: 8,
            background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
            transition: 'all 0.2s', fontFamily: 'inherit',
        },
        googleBtn: {
            width: '100%', padding: '12px', marginTop: 12,
            background: 'rgba(255,255,255,0.05)', color: '#e5e7eb',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s',
        },
        divider: {
            display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0',
            color: '#4b5563', fontSize: 11, fontWeight: 600,
        },
        dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
        footer: { textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6b7280' },
        footLink: { color: '#38bdf8', fontWeight: 700, textDecoration: 'none' },
    };

    return (
        <div style={S.page}>
            <div style={S.glow('10%', '65%', 'rgba(34,197,94,0.06)')} />
            <div style={S.glow('60%', '20%', 'rgba(14,165,233,0.05)')} />
            <div style={S.glow('30%', '80%', 'rgba(139,92,246,0.04)')} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={S.box}>

                <div style={S.logoWrap}>
                    <motion.div
                        style={S.logoIcon}
                        animate={{ boxShadow: ['0 0 30px rgba(34,197,94,0.25)', '0 0 60px rgba(34,197,94,0.45)', '0 0 30px rgba(34,197,94,0.25)'] }}
                        transition={{ repeat: Infinity, duration: 3 }}>
                        <Zap size={30} color="white" />
                    </motion.div>
                    <h1 style={S.h1}>Create Account</h1>
                    <p style={S.sub}>Join the R.I.G.S. industrial network</p>
                </div>

                <div style={S.card}>
                    <form onSubmit={handleSubmit}>
                        {status.message && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={S.alertBox(status.type)}>
                                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {status.message}
                            </motion.div>
                        )}

                        <div style={S.fieldWrap}>
                            <label style={S.label}>Full Name</label>
                            <div style={S.inputWrap}>
                                <User size={16} style={S.icon} />
                                <input
                                    type="text" value={formData.name} required
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    style={S.input}
                                    onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        <div style={S.fieldWrap}>
                            <label style={S.label}>Email Address</label>
                            <div style={S.inputWrap}>
                                <Mail size={16} style={S.icon} />
                                <input
                                    type="email" value={formData.email} required
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@company.com"
                                    style={S.input}
                                    onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={S.fieldWrap}>
                                <label style={S.label}>Password</label>
                                <div style={S.inputWrap}>
                                    <Lock size={16} style={S.icon} />
                                    <input
                                        type={showPw ? 'text' : 'password'} value={formData.password} required
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        style={{ ...S.input, paddingRight: 36 }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0 }}>
                                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div style={S.fieldWrap}>
                                <label style={S.label}>Confirm</label>
                                <div style={S.inputWrap}>
                                    <Lock size={16} style={S.icon} />
                                    <input
                                        type={showPw ? 'text' : 'password'} value={formData.confirmPassword} required
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        style={S.input}
                                        onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info notice */}
                        <div style={{
                            padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                            background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)',
                            fontSize: 12, color: '#6b7280', lineHeight: 1.5,
                        }}>
                            ℹ️ After registration, an admin must approve your account before you can log in.
                        </div>

                        <button
                            type="submit" id="register-btn" disabled={loading}
                            style={{ ...S.submitBtn, opacity: loading ? 0.6 : 1 }}
                            onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 25px rgba(34,197,94,0.5)'; } }}
                            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px rgba(34,197,94,0.35)'; }}>
                            {loading ? 'Creating Account…' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={S.divider}>
                        <div style={S.dividerLine} />
                        <span>OR</span>
                        <div style={S.dividerLine} />
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        style={S.googleBtn}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div style={{ ...S.footer, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, marginTop: 20 }}>
                        Already registered?{' '}
                        <Link to="/login" style={S.footLink}>Sign in here</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
