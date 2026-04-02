import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useMachines } from '../../context/MachineContext';
import MobileDashboard from './MobileDashboard';
import {
    Cpu, Shield, AlertTriangle, Users, UserCheck, Clock,
    CheckCircle, XCircle, Bell, Activity, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileAdminDashboard = () => {
    const { machines } = useMachines();
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [btnLoading, setBtnLoading] = useState({});
    const [viewMode, setViewMode] = useState('ADMIN');
    const [expandedSection, setExpandedSection] = useState('pending');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAdminData = async () => {
        try {
            const [usersRes, pendRes, statsRes, alertRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/users/pending'),
                api.get('/admin/stats'),
                api.get('/alerts?size=10'),
            ]);
            setUsers(usersRes.data);
            setPendingUsers(pendRes.data);
            setStats(statsRes.data);
            setAlerts(alertRes.data.content || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAdminData();
        const t = setInterval(fetchAdminData, 15000);
        return () => clearInterval(t);
    }, []);

    const handleApprove = async (id) => {
        setBtnLoading(p => ({ ...p, [`approve-${id}`]: true }));
        try {
            const u = pendingUsers.find(u => u.id === id);
            setPendingUsers(prev => prev.filter(u => u.id !== id));
            setUsers(prev => [...prev.filter(u => u.id !== id), { ...u, enabled: 1 }]);
            await api.put(`/admin/users/${id}/approve`);
            showToast(`${u?.name || 'Operator'} approved`);
        } catch (e) { showToast('Approval failed', 'error'); fetchAdminData(); }
        finally { setBtnLoading(p => ({ ...p, [`approve-${id}`]: false })); }
    };

    const handleReject = async (id) => {
        setBtnLoading(p => ({ ...p, [`reject-${id}`]: true }));
        try {
            const u = pendingUsers.find(u => u.id === id);
            setPendingUsers(prev => prev.filter(u => u.id !== id));
            await api.put(`/admin/users/${id}/reject`);
            showToast(`${u?.name || 'User'} denied`);
        } catch (e) { showToast('Rejection failed', 'error'); fetchAdminData(); }
        finally { setBtnLoading(p => ({ ...p, [`reject-${id}`]: false })); }
    };

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const activeAlerts = alerts.filter(a => !a.acknowledged);

    if (loading) return (
        <div className="mobile-loading" style={{ minHeight: '50vh' }}>
            <div className="mobile-loading__icon"><Shield size={22} color="#0ea5e9" style={{ animation: 'pulse 1.5s infinite' }} /></div>
            <p className="mobile-loading__text">LOADING ADMIN...</p>
        </div>
    );

    if (viewMode === 'OPERATOR') {
        return (
            <div>
                <button onClick={() => setViewMode('ADMIN')} className="m-admin-toggle m-admin-toggle--exit">
                    <Shield size={14} /> Exit Telemetry View
                </button>
                <MobileDashboard />
            </div>
        );
    }

    return (
        <div className="m-dashboard">
            {/* Pending Banner */}
            <AnimatePresence>
                {pendingUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="m-pending-banner">
                        <Bell size={14} style={{ animation: 'pulse 1s infinite' }} />
                        <span>{pendingUsers.length} PENDING APPROVAL{pendingUsers.length > 1 ? 'S' : ''}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="m-dashboard__header">
                <div>
                    <h1 className="m-dashboard__title">Admin</h1>
                    <p className="m-dashboard__subtitle">System Administration</p>
                </div>
                <button onClick={() => setViewMode('OPERATOR')} className="m-admin-toggle">
                    <Eye size={14} /> Telemetry
                </button>
            </div>

            {/* KPI Grid */}
            <div className="m-admin-kpis">
                {[
                    { label: 'Operators', value: stats.totalWorkers || 0, icon: Users, color: '#0ea5e9' },
                    { label: 'Active', value: stats.activeWorkers || 0, icon: UserCheck, color: '#22c55e' },
                    { label: 'Pending', value: stats.pendingApproval || 0, icon: Clock, color: (stats.pendingApproval || 0) > 0 ? '#f59e0b' : '#64748b' },
                    { label: 'Nodes', value: `${runCount}/${machines.length}`, icon: Cpu, color: '#22c55e' },
                    { label: 'Alerts', value: activeAlerts.length, icon: AlertTriangle, color: activeAlerts.length > 0 ? '#ef4444' : '#64748b' },
                    { label: 'Health', value: machines.filter(m => m.status === 'EMERGENCY').length === 0 ? 'OK' : '⚠', icon: Activity, color: machines.filter(m => m.status === 'EMERGENCY').length === 0 ? '#22c55e' : '#f59e0b' },
                ].map(kpi => (
                    <div key={kpi.label} className="m-admin-kpi">
                        <kpi.icon size={16} style={{ color: kpi.color }} />
                        <div className="m-admin-kpi__value" style={{ color: kpi.color }}>{kpi.value}</div>
                        <div className="m-admin-kpi__label">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Pending Approvals Section */}
            {pendingUsers.length > 0 && (
                <div className="m-section m-section--glass">
                    <button className="m-section__head m-section__head--toggle" onClick={() => setExpandedSection(expandedSection === 'pending' ? null : 'pending')}>
                        <h2 className="m-section__title" style={{ color: '#f59e0b' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
                            Pending Requests ({pendingUsers.length})
                        </h2>
                        {expandedSection === 'pending' ? <CheckCircle size={14} style={{ color: '#475569' }} /> : <Activity size={14} style={{ color: '#475569' }} />}
                    </button>
                    <AnimatePresence>
                        {expandedSection === 'pending' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                <div className="m-user-list">
                                    {pendingUsers.map(u => (
                                        <div key={u.id} className="m-user-card m-user-card--pending">
                                            <div className="m-user-card__avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="m-user-card__info">
                                                <div className="m-user-card__name">{u.name}</div>
                                                <div className="m-user-card__email">{u.email}</div>
                                            </div>
                                            <div className="m-user-card__actions">
                                                <button onClick={() => handleApprove(u.id)} disabled={btnLoading[`approve-${u.id}`]}
                                                    className="m-user-action m-user-action--approve">
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button onClick={() => handleReject(u.id)} disabled={btnLoading[`reject-${u.id}`]}
                                                    className="m-user-action m-user-action--reject">
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Active Operators */}
            <div className="m-section m-section--glass">
                <button className="m-section__head m-section__head--toggle" onClick={() => setExpandedSection(expandedSection === 'operators' ? null : 'operators')}>
                    <h2 className="m-section__title">
                        <UserCheck size={14} /> Operators ({users.filter(u => u.enabled === 1).length})
                    </h2>
                    {expandedSection === 'operators' ? <CheckCircle size={14} style={{ color: '#475569' }} /> : <Activity size={14} style={{ color: '#475569' }} />}
                </button>
                <AnimatePresence>
                    {expandedSection === 'operators' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <div className="m-user-list">
                                {users.filter(u => u.enabled === 1).map(u => (
                                    <div key={u.id} className="m-user-card">
                                        <div className="m-user-card__avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="m-user-card__info">
                                            <div className="m-user-card__name">{u.name}</div>
                                            <div className="m-user-card__email">{u.email} · {u.role}</div>
                                        </div>
                                        <span className="m-user-card__badge">ACTIVE</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Machine Fleet Summary */}
            <div className="m-section m-section--glass">
                <button className="m-section__head m-section__head--toggle" onClick={() => setExpandedSection(expandedSection === 'fleet' ? null : 'fleet')}>
                    <h2 className="m-section__title"><Cpu size={14} /> Node Fleet</h2>
                    {expandedSection === 'fleet' ? <CheckCircle size={14} style={{ color: '#475569' }} /> : <Activity size={14} style={{ color: '#475569' }} />}
                </button>
                <AnimatePresence>
                    {expandedSection === 'fleet' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <div className="m-fleet-list">
                                {machines.map(m => {
                                    const isRun = m.status === 'RUNNING';
                                    const isErr = m.status === 'EMERGENCY';
                                    const color = isRun ? '#22c55e' : isErr ? '#ef4444' : m.status === 'MAINTENANCE' ? '#f59e0b' : '#64748b';
                                    return (
                                        <div key={m.machineId} className="m-fleet-item">
                                            <div className="m-fleet-item__dot" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
                                            <span className="m-fleet-item__name">{m.machineName}</span>
                                            <span className="m-fleet-item__status" style={{ color }}>{m.status}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Alerts Summary */}
            <div className="m-section m-section--glass">
                <div className="m-section__head">
                    <h2 className="m-section__title"><AlertTriangle size={14} /> Recent Incidents</h2>
                </div>
                {activeAlerts.length > 0 ? (
                    <div className="m-alert-list">
                        {activeAlerts.slice(0, 4).map(a => {
                            const color = a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'MEDIUM' ? '#f59e0b' : '#0ea5e9';
                            return (
                                <div key={a.id} className="m-alert-card" style={{ borderLeftColor: color }}>
                                    <AlertTriangle size={14} style={{ color, flexShrink: 0, marginTop: 2 }} />
                                    <div className="m-alert-card__body">
                                        <div className="m-alert-card__msg">{a.message}</div>
                                        <div className="m-alert-card__meta">
                                            <span>{a.machineName}</span>
                                            <span className="m-alert-card__sev" style={{ color, background: `${color}12` }}>{a.severity}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="m-empty">
                        <Shield size={20} style={{ color: 'rgba(34,197,94,0.4)' }} />
                        <span>No Active Alerts</span>
                    </div>
                )}
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className={`m-toast ${toast.type === 'success' ? 'm-toast--success' : 'm-toast--error'}`}>
                        {toast.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileAdminDashboard;
