import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMachines } from '../context/MachineContext';
import MobileNavbar from './MobileNavbar';
import {
    LayoutDashboard, Cpu, AlertTriangle, Shield,
    User, LogOut, Settings, Zap, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileLayout = () => {
    const { user, loading, logout } = useAuth();
    const { isOnline } = useMachines();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    if (loading) return (
        <div className="mobile-loading">
            <div className="mobile-loading__icon">
                <Zap size={32} color="#0ea5e9" className="animate-pulse" />
            </div>
            <p className="mobile-loading__text tracking-[0.3em]">SYSTEM SYNC...</p>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    const isAdmin = user.roles?.includes('ROLE_ADMIN');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { to: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/app/machines', label: 'Fleet', icon: Cpu },
        { to: '/app/alerts', label: 'Alerts', icon: AlertTriangle },
        ...(isAdmin ? [{ to: '/app/admin', label: 'Admin', icon: Shield }] : []),
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="mobile-shell">
            {/* Ultra-Modern Top Bar */}
            <MobileNavbar onMenuToggle={() => setMenuOpen(!menuOpen)} menuOpen={menuOpen} />

            {/* Premium Slide-up Menu Drawer */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="mobile-drawer-overlay" 
                            onClick={() => setMenuOpen(false)} 
                        />
                        <motion.div 
                            initial={{ y: '100%' }} 
                            animate={{ y: 0 }} 
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="mobile-drawer"
                        >
                            <div className="mobile-drawer__handle" />
                            <div className="mobile-drawer__content">
                                <div className="mobile-drawer__user">
                                    <div className="mobile-drawer__avatar">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="mobile-drawer__user-info">
                                        <div className="mobile-drawer__name">{user.name}</div>
                                        <div className="mobile-drawer__role">{isAdmin ? 'System Administrator' : 'Field Operator'}</div>
                                    </div>
                                </div>

                                <div className="mobile-drawer__grid">
                                    <Link to="/app/profile" className="mobile-drawer__btn" onClick={() => setMenuOpen(false)}>
                                        <div className="mobile-drawer__btn-icon bg-sky-500/10 text-sky-400"><User size={20} /></div>
                                        <span>Profile</span>
                                    </Link>
                                    <Link to="/app/settings" className="mobile-drawer__btn" onClick={() => setMenuOpen(false)}>
                                        <div className="mobile-drawer__btn-icon bg-slate-500/10 text-slate-400"><Settings size={20} /></div>
                                        <span>Settings</span>
                                    </Link>
                                </div>

                                <button className="mobile-drawer__logout" onClick={handleLogout}>
                                    <LogOut size={18} /> Sign Out of R.I.G.S.
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main scrollable viewport */}
            <main className="mobile-main">
                <Outlet />
            </main>

            {/* Tactile Bottom Navigation */}
            <nav className="mobile-nav">
                <div className="mobile-nav__blur" />
                <div className="mobile-nav__items">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`mobile-nav__item ${isActive(to) ? 'mobile-nav__item--active' : ''}`}
                        >
                            <div className="mobile-nav__icon-wrapper">
                                <Icon size={22} className="mobile-nav__icon" />
                                {isActive(to) && (
                                    <motion.div 
                                        layoutId="nav-glow" 
                                        className="mobile-nav__glow" 
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </div>
                            <span className="mobile-nav__label">{label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default MobileLayout;
