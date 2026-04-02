import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useMachines } from '../context/MachineContext';
import { LayoutDashboard, Shield, AlertTriangle, User, LogOut, Cpu, Zap, Radio, Clock, Sun, Moon, Settings, RefreshCw } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const { isOnline, reconnect } = useMachines();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        logout();
        showToast('Session terminated', 'success');
        navigate('/');
    };

    if (!user) return null;

    const isAdmin = user.roles?.includes('ROLE_ADMIN');

    const navLinks = [
        { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/app/machines', label: 'Machines', icon: Cpu },
        { to: '/app/alerts', label: 'Alerts', icon: AlertTriangle },
        ...(isAdmin ? [{ to: '/app/admin', label: 'Admin', icon: Shield }] : []),
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--nav-border)',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
                {/* Left — Logo + Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                            borderRadius: 8, padding: 6,
                            boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={16} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.5px', fontFamily: "'JetBrains Mono', monospace" }}>R.I.G.S.</div>
                            <div style={{ fontSize: 8, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginTop: -2 }}>SCADA · v3.0</div>
                        </div>
                    </Link>

                    <div style={{ width: 1, height: 28, background: 'var(--nav-border)' }} />

                    <div style={{ display: 'flex', gap: 2 }}>
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', borderRadius: 6,
                                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    ...(isActive(to)
                                        ? { background: 'rgba(14, 165, 233, 0.12)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.25)' }
                                        : { color: 'var(--text-muted)', border: '1px solid transparent', background: 'transparent' }
                                    ),
                                }}
                            >
                                <Icon size={14} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right — Theme + Clock + Profile + Settings */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        style={{
                            background: 'var(--toggle-bg)', border: '1px solid var(--border)',
                            cursor: 'pointer', padding: 6, borderRadius: 6, color: 'var(--text-muted)',
                            transition: 'all 0.2s', display: 'flex',
                        }}
                    >
                        {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#6366f1" />}
                    </button>

                    {/* System Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: isOnline ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`, borderRadius: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444', boxShadow: isOnline ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(239,68,68,0.5)', animation: isOnline ? 'pulse 2s infinite' : 'alarm-flash 1s infinite' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: isOnline ? '#4ade80' : '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>{isOnline ? 'STREAMING' : 'OFFLINE'}</span>
                        {!isOnline && (
                            <button 
                                onClick={reconnect}
                                title="Force Reconnect"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', color: '#f87171',
                                    padding: '0 0 0 4px', marginLeft: 4, borderLeft: '1px solid rgba(239,68,68,0.2)'
                                }}
                            >
                                <RefreshCw size={10} className="animate-spin-slow" />
                            </button>
                        )}
                    </div>

                    {/* Clock */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--clock-bg)', border: '1px solid var(--border)', borderRadius: 6 }}>
                        <Clock size={12} color="#0ea5e9" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                            {currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' · '}
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                    </div>

                    <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

                    {/* Settings */}
                    <Link to="/app/settings" title="Settings" style={{
                        display: 'flex', padding: 6, borderRadius: 6, textDecoration: 'none',
                        background: isActive('/app/settings') ? 'rgba(14,165,233,0.1)' : 'transparent',
                        color: isActive('/app/settings') ? '#38bdf8' : 'var(--text-muted)',
                        border: '1px solid transparent', transition: 'all 0.2s',
                    }}>
                        <Settings size={15} />
                    </Link>

                    {/* User Profile */}
                    <Link to="/app/profile" style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 10px', borderRadius: 6, textDecoration: 'none',
                        background: isActive('/app/profile') ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                        color: isActive('/app/profile') ? '#38bdf8' : 'var(--text-secondary)',
                        transition: 'all 0.2s', border: '1px solid transparent',
                    }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: 6,
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 10, fontWeight: 900,
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600 }}>{user.name}</div>
                            <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{isAdmin ? 'ADMIN' : 'OPERATOR'}</div>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        title="Terminate Session"
                        style={{
                            background: 'none', border: '1px solid rgba(239, 68, 68, 0.1)',
                            cursor: 'pointer', padding: 6, borderRadius: 6, color: '#475569',
                            transition: 'all 0.2s', display: 'flex',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'none'; }}
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
