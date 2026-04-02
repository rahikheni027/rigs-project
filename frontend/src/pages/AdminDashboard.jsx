import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useMachines } from '../context/MachineContext';
import WorkerDashboard from './WorkerDashboard';
import {
    Cpu, Shield, AlertTriangle, Users, UserCheck, Clock,
    CheckCircle, XCircle, Trash2, Bell,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Shield size={22} className="text-sky-400 animate-pulse" />
            </div>
            <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase">Fetching Admin Credentials...</p>
        </div>
    );

    if (viewMode === 'OPERATOR') {
        return (
            <div className="font-sans text-slate-50 min-h-screen">
                <div className="flex justify-end mb-4">
                    <button onClick={() => setViewMode('ADMIN')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold font-mono uppercase transition-colors">
                        <Shield size={14} /> Exit Telemetry View
                    </button>
                </div>
                <WorkerDashboard />
            </div>
        );
    }

    return (
        <div className="pb-10 font-sans text-slate-50 min-h-screen relative">
            
            {/* Pending Approval Banner */}
            <AnimatePresence>
                {pendingUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <Bell size={16} className="text-amber-500 animate-bounce" />
                        <span className="text-xs font-bold text-amber-400 font-mono tracking-widest uppercase">
                            ⚠ {pendingUsers.length} OPERATOR{pendingUsers.length > 1 ? 'S' : ''} AWAITING ACCESS APPROVAL
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 mt-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight font-mono uppercase text-white m-0">Admin Console</h1>
                        <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 rounded-md px-2 py-0.5 shadow-[0_0_8px_rgba(14,165,233,0.3)]">
                            <Shield size={10} className="text-sky-400" />
                            <span className="text-[10px] font-bold text-sky-400 font-mono tracking-widest">MASTER</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">System Administration & Access Management</p>
                </div>
                <button onClick={() => setViewMode('OPERATOR')} 
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg text-sky-400 text-xs font-bold font-mono tracking-widest uppercase transition-colors">
                    <Activity size={14} /> View Telemetry
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                {[
                    { label: 'Total Ops', value: stats.totalWorkers || 0, icon: Users, cText: 'text-sky-400', cBg: 'bg-sky-400/10', cBorder: 'border-sky-400/20' },
                    { label: 'Active', value: stats.activeWorkers || 0, icon: UserCheck, cText: 'text-green-400', cBg: 'bg-green-400/10', cBorder: 'border-green-400/20' },
                    { label: 'Pending', value: stats.pendingApproval || 0, icon: Clock, cText: (stats.pendingApproval||0)>0?'text-amber-400':'text-slate-400', cBg: (stats.pendingApproval||0)>0?'bg-amber-400/10':'bg-slate-400/10', cBorder: (stats.pendingApproval||0)>0?'border-amber-400/20':'border-slate-400/20' },
                    { label: 'Nodes', value: `${runCount}/${machines.length}`, icon: Cpu, cText: 'text-green-400', cBg: 'bg-green-400/10', cBorder: 'border-green-400/20' },
                    { label: 'Alerts', value: activeAlerts.length, icon: AlertTriangle, cText: activeAlerts.length>0?'text-red-400':'text-slate-400', cBg: activeAlerts.length>0?'bg-red-400/10':'bg-slate-400/10', cBorder: activeAlerts.length>0?'border-red-400/20':'border-slate-400/20' },
                    { label: 'Health', value: alertMachines === 0 ? 'GOOD' : 'WARN', icon: Activity, cText: alertMachines===0?'text-green-400':'text-amber-400', cBg: alertMachines===0?'bg-green-400/10':'bg-amber-400/10', cBorder: alertMachines===0?'border-green-400/20':'border-amber-400/20' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${kpi.cBg} ${kpi.cBorder}`}>
                            <kpi.icon size={16} className={kpi.cText} />
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono mb-0.5">{kpi.label}</div>
                            <div className={`text-lg font-black font-mono tracking-tight ${kpi.cText}`}>{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Access Management Area */}
            <div className={`grid grid-cols-1 ${pendingUsers.length > 0 ? 'lg:grid-cols-2' : ''} gap-6 mb-8`}>
                
                {/* Pending Approvals */}
                {pendingUsers.length > 0 && (
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                        <div className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></div>
                            Pending Access Requests ({pendingUsers.length})
                        </div>
                        <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
                            {pendingUsers.map(u => (
                                <motion.div key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800/40 border border-white/5 hover:border-amber-500/30 border-l-4 border-l-amber-500 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black font-mono shadow-inner shadow-white/20 text-sm">
                                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white mb-0.5">{u.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-widest">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => handleApprove(u.id)} disabled={btnLoading[`approve-${u.id}`]}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-lg text-[10px] font-bold tracking-widest uppercase disabled:opacity-50 transition-colors">
                                            <CheckCircle size={12} /> Approve
                                        </button>
                                        <button onClick={() => handleReject(u.id)} disabled={btnLoading[`reject-${u.id}`]}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold tracking-widest uppercase disabled:opacity-50 transition-colors">
                                            <XCircle size={12} /> Deny
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Approved Operators */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-6">
                        Registered Operators ({users.filter(u => u.enabled === 1).length})
                    </div>
                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
                        {users.filter(u => u.enabled === 1).length > 0 ? users.filter(u => u.enabled === 1).map(u => (
                            <div key={u.id} className="flex items-center justify-between gap-4 p-4 bg-slate-800/40 border border-white/5 hover:border-sky-500/20 border-l-4 border-l-green-500 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black font-mono shadow-inner shadow-white/20 text-sm">
                                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white mb-0.5">{u.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono tracking-widest">{u.email} • {u.role}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="hidden sm:inline-flex text-[9px] font-bold px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono">ACTIVE</span>
                                    <button onClick={() => handleRemoveUser(u.id)} disabled={btnLoading[`remove-${u.id}`]}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-red-500/20">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-500">
                                <Users size={32} className="mb-4 opacity-50" />
                                <span className="text-[10px] font-bold tracking-widest uppercase font-mono">No Operators Registered</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Status & Alarms Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                
                {/* Node Roster - Enhanced Matrix */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-2"><Cpu size={14} /> Global Node Matrix</div>
                        <div className="text-[10px] text-sky-400/60 uppercase">{machines.length} Total Nodes</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {machines.map(m => {
                            const isRun = m.status === 'RUNNING';
                            const isErr = m.status === 'EMERGENCY';
                            const colorClass = isRun ? 'text-green-400' : isErr ? 'text-red-400' : m.status === 'MAINTENANCE' ? 'text-amber-400' : 'text-slate-400';
                            const bgClass = isRun ? 'bg-green-500/5 border-green-500/10' : isErr ? 'bg-red-500/5 border-red-500/10' : 'bg-slate-800/20 border-white/5';
                            
                            return (
                                <div key={m.machineId} className={`flex flex-col gap-1.5 ${bgClass} border rounded-lg p-2.5 hover:bg-slate-800 transition-all group`}>
                                    <div className="flex justify-between items-center">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${colorClass} ${isRun ? 'animate-pulse' : isErr ? 'animate-ping' : ''}`}></div>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">#{m.machineId.slice(-4)}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-white truncate leading-none mb-0.5">{m.machineName}</span>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase font-mono tracking-tighter ${colorClass}`}>
                                            {m.status}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-1 h-3 bg-white/5 rounded-full"></div>
                                            <div className="w-1 h-3 bg-white/5 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Alarm Log */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-6 flex items-center gap-2">
                        <AlertTriangle size={14} /> Recent Incidents
                    </div>
                    <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2">
                        {activeAlerts.length > 0 ? activeAlerts.slice(0,6).map(a => {
                            const isCrit = a.severity === 'CRITICAL';
                            const cClass = isCrit ? 'text-red-400 bg-red-500/10 border-red-500/30 border-l-red-500' : 
                                         a.severity === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 border-l-amber-500' : 
                                         'text-sky-400 bg-sky-500/10 border-sky-500/30 border-l-sky-500';
                            return (
                                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border border-l-4 ${cClass}`}>
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-xs font-bold text-white mb-0.5">{a.message}</div>
                                        <div className="text-[10px] opacity-80 font-mono">{a.machineName} • {a.severity}</div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center min-h-[150px] text-slate-500">
                                <Shield size={24} className="mb-3 opacity-50" />
                                <span className="text-[10px] font-bold tracking-widest uppercase font-mono">No Active Alerts</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Overlays */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl
                        ${toast.type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-400' : 'bg-red-900/80 border-red-500/40 text-red-400'}`}>
                        {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span className="text-xs font-bold font-mono tracking-widest uppercase">{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
