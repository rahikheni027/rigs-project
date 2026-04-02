import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useMachines } from '../context/MachineContext';
import {
    Cpu, Thermometer, Zap, AlertTriangle, Signal, Shield, Clock,
    Wifi, BarChart3, ChevronRight, Activity, ZapOff, List, Grid3X3,
    History, Info, Bell, Settings as SettingsIcon, Package, Search
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]', label: 'RUNNING' },
    STOPPED: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', glow: '', label: 'STOPPED' },
    EMERGENCY: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]', label: 'E-STOP' },
    MAINTENANCE: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: '', label: 'MAINT' },
    CALIBRATING: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: '', label: 'CALIB' },
    OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', glow: '', label: 'OFFLINE' },
};

/* ─── Sub-Component: Live Process Log ─── */
const LiveProcessLog = ({ alerts }) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={14} className="text-sky-400" />
                Live Process Log
            </h2>
            <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500/50 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse delay-75" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence initial={false}>
                {alerts.length > 0 ? alerts.map((a, i) => (
                    <motion.div
                        key={a.id || i}
                        initial={{ opacity: 0, x: -10, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        className="group relative pl-4 border-l-2 border-white/5 hover:border-sky-500/30 transition-colors py-1"
                    >
                        <div className="flex justify-between items-start mb-0.5">
                            <span className="text-[10px] font-mono text-slate-500">
                                {new Date(a.receivedAt || Date.now()).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${a.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-sky-500/10 text-sky-400'}`}>
                                {a.severity}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium group-hover:text-white transition-colors">{a.message}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">{a.machineName}</div>
                    </motion.div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <Activity size={32} className="mb-3" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Listening...</span>
                    </div>
                )}
            </AnimatePresence>
        </div>
    </div>
);

/* ─── Sub-Component: Node Health Matrix ─── */
const NodeHealthMatrix = ({ machines }) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl">
        <h2 className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <Grid3X3 size={14} className="text-emerald-400" />
            Node Health Matrix
        </h2>
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-8 xl:grid-cols-12 gap-2">
            {machines.map(m => {
                const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                return (
                    <Link key={m.machineId} to={`/app/machines/${m.machineId}`} title={`${m.machineName}: ${m.status}`}>
                        <div className={`w-full aspect-square rounded-md border ${sc.border} ${sc.bg} hover:scale-110 transition-transform cursor-pointer relative group`}>
                            {m.status === 'RUNNING' && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse rounded-md" />}
                            {m.status === 'EMERGENCY' && <div className="absolute inset-0 bg-red-500/40 animate-ping rounded-md" />}
                        </div>
                    </Link>
                );
            })}
        </div>
    </div>
);

const Dashboard = () => {
    const { machines, liveAlerts, isOnline } = useMachines();
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!machines || machines?.length === 0) return;
        setLoading(false);
        const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        
        const runningMachs = machines?.filter(m => m?.status === 'RUNNING') || [];
        const avgTemp = machines.length > 0 ? (machines.reduce((s, m) => s + (m?.temperature || 0), 0) / machines.length) : 0;
        const totalPower = machines.reduce((s, m) => s + (m?.powerConsumption || 0), 0);
        const avgEff = runningMachs.length ? runningMachs.reduce((s, m) => s + (m?.efficiency || 0), 0) / runningMachs.length : 0;

        setChartData(prev => {
            if (prev.length > 0 && prev[prev.length - 1].time === now) return prev;
            const next = [...prev, { time: now, temp: avgTemp, power: totalPower, eff: avgEff }];
            return next.length > 20 ? next.slice(-20) : next;
        });
    }, [machines]);

    const stats = useMemo(() => {
        const runCount = machines?.filter(m => m?.status === 'RUNNING')?.length || 0;
        const alertCount = machines?.filter(m => m?.status === 'EMERGENCY' || m?.maintenanceAlert)?.length || 0;
        const avgTemp = (machines?.reduce((s, m) => s + (m?.temperature || 0), 0) / (machines?.length || 1)).toFixed(1);
        const totalPower = machines?.reduce((s, m) => s + (m?.powerConsumption || 0), 0).toFixed(1);
        const runningMachines = machines?.filter(m => m?.status === 'RUNNING') || [];
        const avgEff = runningMachines.length ? (runningMachines.reduce((s, m) => s + (m?.efficiency || 0), 0) / runningMachines.length).toFixed(1) : '0';
        
        return { runCount, alertCount, avgTemp, totalPower, avgEff };
    }, [machines]);

    if (loading && machines.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl animate-pulse" />
                <Activity size={32} className="text-sky-400 animate-pulse relative z-10" />
            </div>
            <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase">Initializing Neurals...</p>
        </div>
    );

    return (
        <div className="pb-10 font-sans text-slate-50 min-h-screen">
            {/* Header Area — High Density */}
            <div className="flex items-center justify-between mb-8 mt-2">
                <div className="flex items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black tracking-tight text-white m-0 uppercase italic">Command Center</h1>
                            <div className="h-1 w-12 bg-sky-500/50 rounded-full" />
                        </div>
                        <p className="text-slate-500 font-bold text-[10px] tracking-widest uppercase">Plant Alpha · Sector 7G · Real-time Control</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Network Status</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-white/5 rounded-lg shadow-inner">
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                            <span className={`text-[10px] font-black tracking-tighter ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>{isOnline ? 'ENCRYPTED CHANNEL' : 'LINK SEVERED'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main High-Density Grid */}
            <div className="grid grid-cols-12 gap-6">
                
                {/* LEFT COLUMN (Sidebar-esque Log) — Col 3 */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="h-[500px]">
                        <LiveProcessLog alerts={liveAlerts} />
                    </div>
                    <NodeHealthMatrix machines={machines} />
                </div>

                {/* MIDDLE/RIGHT CONTENT — Col 9 */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    
                    {/* KPI Strip — Dense Version */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { label: 'FLEET', val: `${stats.runCount}/${machines.length}`, icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                            { label: 'ALERTS', val: stats.alertCount, icon: AlertTriangle, color: stats.alertCount > 0 ? 'text-red-400' : 'text-slate-500', bg: stats.alertCount > 0 ? 'bg-red-400/5' : 'bg-white/5' },
                            { label: 'TEMP_AVG', val: `${stats.avgTemp}°C`, icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-400/5' },
                            { label: 'LOAD_TOTAL', val: `${stats.totalPower}kW`, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
                            { label: 'OEE_INDEX', val: `${stats.avgEff}%`, icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-400/5' },
                        ].map(kpi => (
                            <div key={kpi.label} className={`border border-white/5 p-4 rounded-3xl ${kpi.bg} backdrop-blur-md`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em]">{kpi.label}</span>
                                    <kpi.icon size={12} className={kpi.color} />
                                </div>
                                <div className={`text-xl font-black ${kpi.color} tracking-tighter`}>{kpi.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart & Telemetry Wave */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl h-[380px] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Activity size={120} className="text-sky-500" />
                        </div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <Signal size={14} className="text-sky-400" />
                                Fleet Telemetry Waveform
                            </h2>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400"><div className="w-2 h-2 rounded-full bg-amber-400" /> TEMP</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-400" /> LOAD</div>
                            </div>
                        </div>
                        <div className="flex-1 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="tCol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="pCol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/><stop offset="95%" stopColor="#818cf8" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip content={<div className="bg-slate-900 border border-white/10 p-2 rounded text-[10px] font-mono shadow-2xl" />} />
                                    <Area type="monotone" dataKey="temp" stroke="#fbbf24" fill="url(#tCol)" strokeWidth={2} dot={false} />
                                    <Area type="monotone" dataKey="power" stroke="#818cf8" fill="url(#pCol)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Machine Strips — Ultra High Density Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package size={14} className="text-slate-500" />
                                Unit Telemetry Grid
                            </h2>
                            <Link to="/app/machines" className="text-[9px] font-black text-sky-400 tracking-widest uppercase hover:underline">Full Control Panel »</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {(machines || [])?.slice(0, 12).map((m, i) => {
                                const sc = STATUS_CONFIG[m?.status] || STATUS_CONFIG.OFFLINE;
                                return (
                                    <Link key={m?.machineId} to={`/app/machines/${m?.machineId}`} className={`group flex items-center gap-4 p-3 bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/80 transition-all duration-300 ${sc.glow}`}>
                                        <div className={`w-10 h-10 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <Cpu size={18} className={sc.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="text-xs font-black text-slate-200 truncate pr-2 uppercase italic">{m?.machineName || 'Unknown Node'}</h3>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1"><Thermometer size={10} className="text-slate-500" /><span className="text-[10px] font-mono text-slate-300">{m?.temperature ? m.temperature.toFixed(0) : '--'}°</span></div>
                                                <div className="flex items-center gap-1"><Zap size={10} className="text-slate-500" /><span className="text-[10px] font-mono text-slate-300">{m?.powerConsumption ? m.powerConsumption.toFixed(1) : '--'}kW</span></div>
                                                <div className="flex items-center gap-1"><BarChart3 size={10} className="text-slate-500" /><span className="text-[10px] font-mono text-slate-300">{m?.efficiency ? m.efficiency.toFixed(0) : '--'}%</span></div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;

