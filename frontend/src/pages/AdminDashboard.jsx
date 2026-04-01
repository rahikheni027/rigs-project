import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useMachines } from '../context/MachineContext';
import WorkerDashboard from './WorkerDashboard';
import {
    Cpu, Shield, AlertTriangle, Users, UserCheck, UserX, Clock,
    CheckCircle, XCircle, Trash2, Bell, BarChart3, TrendingUp,
    Signal, Server, Database, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const S = {
    card: { background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.08)', borderRadius: 10, padding: 16 },
    label: { fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" },
};

const AdminDashboard = () => {
    const { machines } = useMachines();
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [btnLoading, setBtnLoading] = useState({});
    const [viewMode, setViewMode] = useState('ADMIN');

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
        const t = setInterval(fetchAdminData, 10000);
        return () => clearInterval(t);
    }, []);

    const handleApprove = async (id) => {
        setBtnLoading(p => ({ ...p, [`approve-${id}`]: true }));
        try {
            const userToApprove = pendingUsers.find(u => u.id === id);
            setPendingUsers(prev => prev.filter(u => u.id !== id));
            setUsers(prev => [...prev.filter(u => u.id !== id), { ...userToApprove, enabled: 1 }]);
            setStats(prev => ({ ...prev, activeWorkers: (prev.activeWorkers || 0) + 1, pendingApproval: Math.max(0, (prev.pendingApproval || 0) - 1) }));
            await api.put(`/admin/users/${id}/approve`);
            showToast(`Operator ${userToApprove?.name || ''} access granted`);
        } catch (e) { showToast('Approval failed', 'error'); fetchAdminData(); }
        finally { setBtnLoading(p => ({ ...p, [`approve-${id}`]: false })); }
    };

    const handleReject = async (id) => {
        setBtnLoading(p => ({ ...p, [`reject-${id}`]: true }));
        try {
            const userToReject = pendingUsers.find(u => u.id === id);
            setPendingUsers(prev => prev.filter(u => u.id !== id));
            setStats(prev => ({ ...prev, pendingApproval: Math.max(0, (prev.pendingApproval || 0) - 1) }));
            await api.put(`/admin/users/${id}/reject`);
            showToast(`${userToReject?.name || ''} access denied`);
        } catch (e) { showToast('Rejection failed', 'error'); fetchAdminData(); }
        finally { setBtnLoading(p => ({ ...p, [`reject-${id}`]: false })); }
    };

    const handleRemoveUser = async (id) => {
        setBtnLoading(p => ({ ...p, [`remove-${id}`]: true }));
        try {
            const userToRemove = users.find(u => u.id === id);
            setUsers(prev => prev.filter(u => u.id !== id));
            setStats(prev => ({ ...prev, activeWorkers: Math.max(0, (prev.activeWorkers || 0) - 1), totalWorkers: Math.max(0, (prev.totalWorkers || 0) - 1) }));
            await api.delete(`/admin/users/${id}`);
            showToast(`${userToRemove?.name || 'User'} removed from system`);
        } catch (e) { showToast('Removal failed', 'error'); fetchAdminData(); }
        finally { setBtnLoading(p => ({ ...p, [`remove-${id}`]: false })); }
    };

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertMachines = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const activeAlerts = alerts.filter(a => !a.acknowledged);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <Shield size={28} color="#0ea5e9" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>LOADING ADMIN CONSOLE...</p>
        </div>
    );

    if (viewMode === 'OPERATOR') {
        return (
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button 
                        onClick={() => setViewMode('ADMIN')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6, color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', transition: 'all 0.2s'
                        }}
                    >
                        <Shield size={14} /> Exit Telemetry View
                    </button>
                </div>
                <WorkerDashboard />
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f1f5f9', position: 'relative' }}>
            {/* Pending Approval Banner */}
            {pendingUsers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                        borderRadius: 6, marginBottom: 14,
                    }}
                >
                    <Bell size={14} color="#f59e0b" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
                        ⚠ {pendingUsers.length} OPERATOR{pendingUsers.length > 1 ? 'S' : ''} AWAITING ACCESS APPROVAL
                    </span>
                </motion.div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>ADMIN CONSOLE</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 4, padding: '3px 8px' }}>
                            <Shield size={10} color="#0ea5e9" />
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>ADMIN</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>SYSTEM ADMINISTRATION & ACCESS MANAGEMENT</p>
                </div>
                
                <button 
                    onClick={() => setViewMode('OPERATOR')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                        borderRadius: 6, color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', transition: 'all 0.2s'
                    }}
                >
                    <Activity size={14} /> View Telemetry
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
                {[
                    { label: 'Total Operators', value: stats.totalWorkers || 0, icon: Users, color: '#0ea5e9' },
                    { label: 'Active', value: stats.activeWorkers || 0, icon: UserCheck, color: '#22c55e' },
                    { label: 'Pending', value: stats.pendingApproval || 0, icon: Clock, color: (stats.pendingApproval || 0) > 0 ? '#f59e0b' : '#64748b' },
                    { label: 'Machines', value: `${runCount}/${machines.length}`, icon: Cpu, color: '#22c55e' },
                    { label: 'Alerts', value: activeAlerts.length, icon: AlertTriangle, color: activeAlerts.length > 0 ? '#ef4444' : '#64748b' },
                    { label: 'System Health', value: alertMachines === 0 ? 'GOOD' : 'WARN', icon: Activity, color: alertMachines === 0 ? '#22c55e' : '#f59e0b' },
                ].map(kpi => (
                    <div key={kpi.label} style={{
                        ...S.card, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: `${kpi.color}10`, border: `1px solid ${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <kpi.icon size={13} color={kpi.color} />
                        </div>
                        <div>
                            <div style={{ ...S.label, marginBottom: 2 }}>{kpi.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Users + Approved Users */}
            <div style={{ display: 'grid', gridTemplateColumns: pendingUsers.length > 0 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>
                {/* Pending Approval */}
                {pendingUsers.length > 0 && (
                    <div style={S.card}>
                        <div style={{ ...S.label, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'alarm-flash 1.5s infinite' }} />
                            PENDING ACCESS REQUESTS ({pendingUsers.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                            {pendingUsers.map(u => (
                                <motion.div key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                        background: 'rgba(15,23,42,0.5)', borderRadius: 8,
                                        borderLeft: '3px solid #f59e0b',
                                    }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: 7,
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: 11, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                                    }}>
                                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{u.name}</div>
                                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{u.email}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleApprove(u.id)} disabled={btnLoading[`approve-${u.id}`]}
                                            style={{
                                                padding: '5px 10px', borderRadius: 5, border: '1px solid rgba(34,197,94,0.2)',
                                                background: 'rgba(34,197,94,0.06)', color: '#4ade80', fontSize: 9, fontWeight: 700,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                                fontFamily: "'JetBrains Mono', monospace", opacity: btnLoading[`approve-${u.id}`] ? 0.5 : 1,
                                            }}>
                                            <CheckCircle size={11} />APPROVE
                                        </button>
                                        <button onClick={() => handleReject(u.id)} disabled={btnLoading[`reject-${u.id}`]}
                                            style={{
                                                padding: '5px 10px', borderRadius: 5, border: '1px solid rgba(239,68,68,0.2)',
                                                background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 9, fontWeight: 700,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                                fontFamily: "'JetBrains Mono', monospace", opacity: btnLoading[`reject-${u.id}`] ? 0.5 : 1,
                                            }}>
                                            <XCircle size={11} />DENY
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Operators */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 12 }}>REGISTERED OPERATORS ({users.filter(u => u.enabled === 1).length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
                        {users.filter(u => u.enabled === 1).length > 0 ? users.filter(u => u.enabled === 1).map(u => (
                            <div key={u.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                background: 'rgba(15,23,42,0.5)', borderRadius: 6,
                                borderLeft: '2px solid #22c55e',
                            }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: 6,
                                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                                }}>
                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name}</div>
                                    <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{u.email} · {u.role}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'rgba(34,197,94,0.06)', color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>ACTIVE</span>
                                    <button onClick={() => handleRemoveUser(u.id)} disabled={btnLoading[`remove-${u.id}`]}
                                        style={{
                                            padding: 4, borderRadius: 4, border: '1px solid rgba(239,68,68,0.1)',
                                            background: 'transparent', color: '#475569', cursor: 'pointer',
                                            display: 'flex', transition: 'all 0.2s',
                                            opacity: btnLoading[`remove-${u.id}`] ? 0.5 : 1,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                <Users size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
                                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>NO OPERATORS REGISTERED</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Machine Status + Recent Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Machine Status */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 12 }}>MACHINE STATUS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {machines.map(m => {
                            const c = m.status === 'RUNNING' ? '#22c55e' : m.status === 'EMERGENCY' ? '#ef4444' : m.status === 'MAINTENANCE' ? '#f59e0b' : '#64748b';
                            return (
                                <div key={m.machineId} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                                    background: 'rgba(15,23,42,0.5)', borderRadius: 6,
                                }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, animation: m.status === 'RUNNING' ? 'pulse 2s infinite' : m.status === 'EMERGENCY' ? 'alarm-flash 0.8s infinite' : 'none' }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>{m.machineName}</span>
                                    <span style={{ fontSize: 8, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{m.status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Alerts */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 12 }}>RECENT ALERTS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {activeAlerts.length > 0 ? activeAlerts.slice(0, 6).map(a => {
                            const c = a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'MEDIUM' ? '#f59e0b' : '#0ea5e9';
                            return (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                                    background: 'rgba(15,23,42,0.5)', borderRadius: 6,
                                    borderLeft: `2px solid ${c}`,
                                }}>
                                    <AlertTriangle size={11} color={c} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.message}</div>
                                        <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{a.machineName} · {a.severity}</div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                <Shield size={18} style={{ marginBottom: 6, opacity: 0.4 }} />
                                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>NO ACTIVE ALERTS</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        style={{
                            position: 'fixed', bottom: 24, right: 24,
                            background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            borderRadius: 8, padding: '10px 16px',
                            display: 'flex', alignItems: 'center', gap: 8,
                            backdropFilter: 'blur(12px)', zIndex: 100,
                        }}>
                        {toast.type === 'success' ? <CheckCircle size={14} color="#4ade80" /> : <XCircle size={14} color="#f87171" />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: toast.type === 'success' ? '#4ade80' : '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
