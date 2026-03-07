import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle2, Clock } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Handle OAuth callback messages
        const oauth = searchParams.get('oauth');
        if (oauth === 'pending') {
            setInfo('Your account is pending admin approval. Please wait for the admin to approve your access.');
        } else if (oauth === 'locked') {
            setError('Your account has been locked. Please contact the administrator.');
        }

        // If user is already logged in (e.g., from OAuth redirect), go to dashboard
        if (user) {
            navigate('/app/dashboard');
        }
    }, [user, searchParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfo('');
        try {
            await login(email, password);
            navigate('/app/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || '';
            if (msg.includes('disabled') || msg.includes('not enabled')) {
                setError('Your account is pending admin approval. Please wait.');
            } else if (msg.includes('locked')) {
                setError('Your account has been locked. Contact the administrator.');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
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
        box: { width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 },
        logoWrap: { textAlign: 'center', marginBottom: 36 },
        logoIcon: {
            display: 'inline-flex', width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 50px rgba(14,165,233,0.4)', marginBottom: 16,
        },
        h1: { fontSize: 28, fontWeight: 900, color: '#f9fafb', margin: 0, letterSpacing: '-0.5px' },
        sub: { fontSize: 14, color: '#6b7280', marginTop: 6 },
        card: {
            background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)',
        },
        alertBox: (type) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: type === 'error' ? 'rgba(239,68,68,0.08)' : type === 'info' ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.2)' : type === 'info' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
            borderRadius: 10,
            color: type === 'error' ? '#f87171' : type === 'info' ? '#fbbf24' : '#4ade80',
            fontSize: 13, marginBottom: 20,
        }),
        fieldWrap: { marginBottom: 18 },
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
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(14,165,233,0.35)',
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
            <div style={S.glow('5%', '25%', 'rgba(14,165,233,0.06)')} />
            <div style={S.glow('55%', '65%', 'rgba(99,102,241,0.05)')} />
            <div style={S.glow('80%', '10%', 'rgba(139,92,246,0.04)')} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={S.box}>

                <div style={S.logoWrap}>
                    <motion.div
                        style={S.logoIcon}
                        animate={{ boxShadow: ['0 0 30px rgba(14,165,233,0.3)', '0 0 60px rgba(14,165,233,0.5)', '0 0 30px rgba(14,165,233,0.3)'] }}
                        transition={{ repeat: Infinity, duration: 3 }}>
                        <Zap size={30} color="white" />
                    </motion.div>
                    <h1 style={S.h1}>Welcome back</h1>
                    <p style={S.sub}>Remote Industrial Governance System</p>
                </div>

                <div style={S.card}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={S.alertBox('error')}>
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        {info && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={S.alertBox('info')}>
                                <Clock size={16} />
                                {info}
                            </motion.div>
                        )}

                        <div style={S.fieldWrap}>
                            <label style={S.label}>Email Address</label>
                            <div style={S.inputWrap}>
                                <Mail size={16} style={S.icon} />
                                <input
                                    type="email" value={email} required
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@rigs.com"
                                    style={S.input}
                                    onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        <div style={S.fieldWrap}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                                <label style={{ ...S.label, marginBottom: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
                            </div>
                            <div style={S.inputWrap}>
                                <Lock size={16} style={S.icon} />
                                <input
                                    type={showPw ? 'text' : 'password'} value={password} required
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ ...S.input, paddingRight: 42 }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 14, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0 }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit" id="login-btn" disabled={loading}
                            style={{ ...S.submitBtn, opacity: loading ? 0.6 : 1 }}
                            onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 25px rgba(14,165,233,0.5)'; } }}
                            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px rgba(14,165,233,0.35)'; }}>
                            {loading ? 'Signing in…' : 'Sign In to R.I.G.S.'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={S.divider}>
                        <div style={S.dividerLine} />
                        <span>OR</span>
                        <div style={S.dividerLine} />
                    </div>

                    {/* Google OAuth */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={S.googleBtn}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <div style={{ ...S.footer, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, marginTop: 20 }}>
                        New operator?{' '}
                        <Link to="/register" style={S.footLink}>Create an account</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
