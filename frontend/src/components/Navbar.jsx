import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Shield, AlertTriangle, User, LogOut, Cpu, Zap } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
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
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                {/* Logo + links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'white' }}>
                        <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', borderRadius: 10, padding: 7, boxShadow: '0 0 16px rgba(14,165,233,0.35)' }}>
                            <Zap size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.5px' }}>R.I.G.S.</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: -2 }}>Industrial</div>
                        </div>
                    </Link>

                    <div style={{ display: 'flex', gap: 4 }}>
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '7px 12px', borderRadius: 10,
                                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    ...(isActive(to)
                                        ? { background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.22)' }
                                        : { color: '#9ca3af', border: '1px solid transparent', background: 'transparent' }
                                    ),
                                }}
                            >
                                <Icon size={15} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link to="/app/profile" style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', borderRadius: 10, textDecoration: 'none',
                        background: isActive('/app/profile') ? 'rgba(14,165,233,0.12)' : 'transparent',
                        color: isActive('/app/profile') ? '#38bdf8' : '#9ca3af',
                        transition: 'all 0.2s',
                        border: '1px solid transparent',
                    }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 12, fontWeight: 900,
                        }}>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 8, borderRadius: 8, color: '#6b7280',
                            transition: 'all 0.2s', display: 'flex',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'none'; }}
                    >
                        <LogOut size={17} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
