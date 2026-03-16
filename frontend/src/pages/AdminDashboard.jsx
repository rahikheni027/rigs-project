import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import {
    Users, UserCheck, UserX, Shield, Clock, Trash2,
    CheckCircle2, XCircle, AlertCircle, Activity,
    Cpu, TrendingUp, Zap, ChevronRight, Search,
    RefreshCw, Mail, Calendar
} from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [machines, setMachines] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);

    const fetchData = async () => {
        try {
            const [usersRes, pendingRes, statsRes, machinesRes, alertsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/users/pending'),
                api.get('/admin/stats'),
                api.get('/machines'),
                api.get('/alerts'),
            ]);
            setUsers(usersRes.data);
            setPendingUsers(pendingRes.data);
            setStats(statsRes.data);
            setMachines(machinesRes.data);
            setAlerts(alertsRes.data.content || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 15000);
        return () => clearInterval(t);
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await api.put(`/admin/users/${id}/approve`);
            showNotification('User approved successfully!');
            fetchData();
        } catch (e) {
            showNotification('Failed to approve user', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        setActionLoading(id);
        try {
            await api.put(`/admin/users/${id}/reject`);
            showNotification('User rejected');
            fetchData();
        } catch (e) {
            showNotification('Failed to reject user', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemove = async (id, name) => {
        if (!window.confirm(`Remove worker "${name}"? This cannot be undone.`)) return;
        setActionLoading(id);
        try {
            await api.delete(`/admin/users/${id}`);
            showNotification('Worker removed');
            fetchData();
        } catch (e) {
            showNotification('Failed to remove worker', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const running = machines.filter(m => m.status === 'RUNNING').length;
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;
    const health = machines.length > 0 ? Math.round((running / machines.length) * 100) : 0;

    const filteredUsers = (activeTab === 'pending' ? pendingUsers : users)
        .filter(u => !searchQuery ||
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.2))',
                    border: '1px solid rgba(14,165,233,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <Shield size={26} color="#38bdf8" />
            </motion.div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading admin panel…</p>
        </div>
    );

    const statCards = [
        { label: 'Total Machines', value: machines.length, icon: Cpu, gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', shadow: 'rgba(14,165,233,0.3)' },
        { label: 'Running', value: running, icon: Activity, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', shadow: 'rgba(34,197,94,0.3)' },
        { label: 'Active Workers', value: stats.activeWorkers || 0, icon: UserCheck, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139,92,246,0.3)' },
        { label: 'Pending Approval', value: stats.pendingApproval || 0, icon: Clock, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)' },
    ];

    return (
        <div style={{ color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Notification toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed', top: 80, left: '50%',
                            zIndex: 100, padding: '12px 24px', borderRadius: 12,
                            background: notification.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${notification.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: notification.type === 'success' ? '#4ade80' : '#f87171',
                            backdropFilter: 'blur(20px)',
                            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                        {notification.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Control Center</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' }}>Command Center</h1>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Manage your industrial network and team</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                {statCards.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: 24,
                            display: 'flex', alignItems: 'center', gap: 16,
                            cursor: 'default', transition: 'all 0.25s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>
                        <div style={{
                            background: s.gradient, borderRadius: 14, padding: 14,
                            boxShadow: `0 4px 20px ${s.shadow}`, flexShrink: 0,
                        }}>
                            <s.icon size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                            <div style={{ fontSize: 30, fontWeight: 900, color: '#f9fafb', lineHeight: 1.1 }}>{s.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main content grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                {/* User management panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: 'rgba(17,24,39,0.8)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, padding: 24,
                    }}>

                    {/* Tabs + Search */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 4, background: 'rgba(31,41,55,0.5)', borderRadius: 10, padding: 4 }}>
                            {[
                                { id: 'pending', label: 'Pending', icon: Clock, count: pendingUsers.length },
                                { id: 'all', label: 'All Workers', icon: Users, count: users.length },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '8px 16px', borderRadius: 8,
                                        border: 'none', cursor: 'pointer',
                                        fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                                        transition: 'all 0.2s',
                                        ...(activeTab === tab.id
                                            ? { background: 'rgba(14,165,233,0.15)', color: '#38bdf8' }
                                            : { background: 'transparent', color: '#6b7280' }
                                        ),
                                    }}>
                                    <tab.icon size={14} />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span style={{
                                            background: activeTab === tab.id ? 'rgba(14,165,233,0.2)' : 'rgba(107,114,128,0.2)',
                                            padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                                        }}>{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#4b5563' }} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '8px 12px 8px 32px',
                                    background: 'rgba(31,41,55,0.6)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8, color: '#f9fafb',
                                    fontSize: 12, fontFamily: 'inherit', outline: 'none',
                                    width: 200, transition: 'all 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>
                    </div>

                    {/* User list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence mode="popLayout">
                            {filteredUsers.length > 0 ? filteredUsers.map((user, i) => (
                                <motion.div
                                    key={user.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 16px', borderRadius: 12,
                                        background: 'rgba(31,41,55,0.4)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'}>

                                    {/* Avatar */}
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: user.enabled === 1
                                            ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
                                            : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: 14, fontWeight: 900, flexShrink: 0,
                                    }}>
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{user.name}</span>
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                ...(user.provider === 'GOOGLE'
                                                    ? { background: 'rgba(234,179,8,0.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.2)' }
                                                    : { background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.15)' }
                                                ),
                                            }}>{user.provider || 'LOCAL'}</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Mail size={10} /> {user.email}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        ...(user.enabled === 1
                                            ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                                            : { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }
                                        ),
                                    }}>
                                        {user.enabled === 1 ? 'Active' : 'Pending'}
                                    </span>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {user.enabled === 0 && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    title="Approve"
                                                    style={{
                                                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                                                        borderRadius: 8, padding: 7, cursor: 'pointer',
                                                        color: '#4ade80', transition: 'all 0.2s', display: 'flex',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}>
                                                    <CheckCircle2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    title="Reject"
                                                    style={{
                                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                        borderRadius: 8, padding: 7, cursor: 'pointer',
                                                        color: '#f87171', transition: 'all 0.2s', display: 'flex',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                        {user.enabled === 1 && (
                                            <button
                                                onClick={() => handleRemove(user.id, user.name)}
                                                disabled={actionLoading === user.id}
                                                title="Remove Worker"
                                                style={{
                                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                                    borderRadius: 8, padding: 7, cursor: 'pointer',
                                                    color: '#f87171', transition: 'all 0.2s', display: 'flex',
                                                    opacity: 0.6,
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <UserCheck size={36} color="#4ade80" style={{ margin: '0 auto 12px' }} />
                                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                                        {activeTab === 'pending' ? 'No pending approvals' : 'No workers found'}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Right sidebar — system overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* System health */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: 24,
                        }}>
                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <TrendingUp size={18} color="#38bdf8" />
                            <span>System Health</span>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="54" fill="none"
                                        stroke={health >= 80 ? '#22c55e' : health >= 50 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${(health / 100) * 339} 339`}
                                        transform="rotate(-90 60 60)"
                                        style={{ transition: 'stroke-dasharray 1s ease' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute', inset: 0, display: 'flex',
                                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ fontSize: 28, fontWeight: 900, color: '#f9fafb' }}>{health}%</span>
                                    <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>HEALTH</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ background: 'rgba(31,41,55,0.5)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80' }}>{running}</div>
                                <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>RUNNING</div>
                            </div>
                            <div style={{ background: 'rgba(31,41,55,0.5)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#f87171' }}>{activeAlerts}</div>
                                <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>ALERTS</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: 24,
                        }}>
                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Zap size={18} color="#fbbf24" />
                            <span>Quick Info</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Total Workers', value: stats.totalWorkers || 0, color: '#38bdf8' },
                                { label: 'Active Workers', value: stats.activeWorkers || 0, color: '#4ade80' },
                                { label: 'Pending Approval', value: stats.pendingApproval || 0, color: '#fbbf24' },
                                { label: 'Total Machines', value: machines.length, color: '#8b5cf6' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', borderRadius: 10,
                                    background: 'rgba(31,41,55,0.4)',
                                }}>
                                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.label}</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
