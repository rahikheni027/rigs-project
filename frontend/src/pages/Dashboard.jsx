import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import {
    Cpu, Thermometer, Zap, AlertTriangle, Signal, Shield, Clock,
    Wifi, BarChart3, ChevronRight, Activity, ZapOff
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', label: 'RUNNING' },
    STOPPED: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', glow: '', label: 'STOPPED' },
    EMERGENCY: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]', label: 'E-STOP' },
    MAINTENANCE: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: '', label: 'MAINTENANCE' },
    CALIBRATING: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: '', label: 'CALIBRATING' },
    OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', glow: '', label: 'OFFLINE' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
            <div className="text-slate-400 text-xs font-semibold mb-2">{label}</div>
            {payload.map(p => (
                <div key={p.name} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-300 text-sm">{p.name}:</span>
                    <span className="text-white font-bold text-sm">{p.value != null ? Number(p.value).toFixed(1) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const [machines, setMachines] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const [machRes, alertRes] = await Promise.all([
                    api.get('/machines', { signal: controller.signal }),
                    api.get('/alerts?size=10', { signal: controller.signal }),
                ]);
                if (!isMounted) return;
                
                setMachines(machRes.data);
                setAlerts(alertRes.data.content || []);

                setChartData(prev => {
                    const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    if (prev.length > 0 && prev[prev.length - 1].time === now) return prev;
                    
                    const runningMachs = machRes.data.filter(m => m.status === 'RUNNING');
                    const avgTemp = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.temperature || 0), 0) / machRes.data.length : 0;
                    const totalPower = machRes.data.reduce((s, m) => s + (m.powerConsumption || 0), 0);
                    const avgEff = runningMachs.length ? runningMachs.reduce((s, m) => s + (m.efficiency || 0), 0) / runningMachs.length : 0;
                    
                    const next = [...prev, { time: now, temp: avgTemp, power: totalPower, eff: avgEff }];
                    return next.length > 30 ? next.slice(-30) : next;
                });
            } catch (e) { 
                if (!isMounted || e.name === 'CanceledError') return;
            } finally { 
                if (isMounted) setLoading(false); 
            }
        };

        fetchData();
        const t = setInterval(fetchData, 10000);
        return () => {
            isMounted = false;
            clearInterval(t);
            controller.abort();
        };
    }, []);

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length).toFixed(1) : '—';
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0).toFixed(1);
    
    const runningMachines = machines.filter(m => m.status === 'RUNNING');
    const avgEff = runningMachines.length ? (runningMachines.reduce((s, m) => s + (m.efficiency || 0), 0) / runningMachines.length).toFixed(1) : '—';

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl animate-pulse"></div>
                <Activity size={32} className="text-sky-400 animate-pulse relative z-10" />
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Loading Workspace...</p>
        </div>
    );

    return (
        <div className="pb-10 font-sans text-slate-50 min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Admin Overview</h1>
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Live</span>
                        </div>
                    </div>
                    <p className="text-slate-400 font-medium text-sm md:text-base">SCADA Master Command & Data Acquisition</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 shadow-inner">
                    <Wifi size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-300 font-medium">Broker Connected</span>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Fleet Status', value: `${runCount}/${machines.length}`, sub: 'Active Output', icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                    { label: 'Active Alerts', value: alertCount, sub: alertCount > 0 ? 'Requires Action' : 'All Clear', icon: AlertTriangle, color: alertCount > 0 ? 'text-red-400' : 'text-emerald-400', bg: alertCount > 0 ? 'bg-red-400/10' : 'bg-emerald-400/10', border: alertCount > 0 ? 'border-red-400/20' : 'border-emerald-400/20' },
                    { label: 'System Temp', value: `${avgTemp}°C`, sub: 'Plant Average', icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
                    { label: 'Power Draw', value: `${totalPower} kW`, sub: 'Total Base Load', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
                    { label: 'OEE Rating', value: `${avgEff}%`, sub: 'Running Machines', icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} 
                        className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl group hover:bg-slate-900/60 transition-colors">
                        
                        {/* Decorative background glow */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${kpi.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                        
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{kpi.label}</h3>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg} border ${kpi.border}`}>
                                <kpi.icon size={16} className={kpi.color} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-white mb-1 tabular-nums tracking-tight">{kpi.value}</div>
                            <div className="text-xs text-slate-500 font-medium">{kpi.sub}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Chart Segment - Spans 2 Columns on Desktop */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest">Fleet Telemetry Trends</h2>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Temp</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Power</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="pColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="temp" stroke="#fbbf24" fill="url(#tColor)" strokeWidth={3} name="Avg Temp (°C)" dot={false} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#0f172a', strokeWidth: 3 }} />
                                <Area type="monotone" dataKey="power" stroke="#818cf8" fill="url(#pColor)" strokeWidth={3} name="Total Power (kW)" dot={false} activeDot={{ r: 6, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts Segment */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} className="text-slate-400" />
                            System Alerts
                        </h2>
                        <Link to="/app/alerts" className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-colors">
                            VIEW ALL <ChevronRight size={14} />
                        </Link>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        <AnimatePresence>
                            {alerts.length > 0 ? alerts.slice(0, 6).map((a, i) => {
                                const isCrit = a.severity === 'CRITICAL';
                                const colorClass = isCrit ? 'text-red-400 bg-red-400/10 border-red-500/30' : 
                                                   a.severity === 'MEDIUM' ? 'text-amber-400 bg-amber-400/10 border-amber-500/30' : 
                                                   'text-sky-400 bg-sky-400/10 border-sky-500/30';
                                const iconColor = isCrit ? 'text-red-400' : a.severity === 'MEDIUM' ? 'text-amber-400' : 'text-sky-400';
                                
                                return (
                                    <motion.div key={a.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} 
                                        className={`flex items-start gap-4 p-4 rounded-2xl border ${colorClass} ${a.acknowledged ? 'opacity-60 grayscale-[50%]' : ''} backdrop-blur-md`}>
                                        <div className={`mt-0.5 ${iconColor}`}>
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-white mb-1.5 leading-snug">{a.message}</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400 font-medium truncate pr-2">{a.machineName}</span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/20 ${iconColor}`}>{a.severity}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
                                        <Shield size={28} className="text-emerald-500/50" />
                                    </div>
                                    <div className="text-sm font-semibold text-slate-400 mb-1">No Active Alerts</div>
                                    <div className="text-xs">All systems nominal</div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Fleet Status Grid */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-slate-400" />
                        Process Unit Status
                    </h2>
                    <Link to="/app/machines" className="text-xs bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                        CONTROL CENTER <ChevronRight size={14} />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {machines.map((m, i) => {
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                        return (
                            <Link key={m.machineId} to={`/app/machines/${m.machineId}`} className="block group">
                                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} 
                                    className={`relative flex flex-col p-5 bg-slate-800/40 hover:bg-slate-800/70 border ${sc.border} rounded-2xl transition-all duration-300 overflow-hidden ${sc.glow} group-hover:-translate-y-1`}>
                                    
                                    {/* Top Accent Line */}
                                    <div className={`absolute top-0 left-0 w-full h-1 ${sc.bg} opacity-50`}></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center border ${sc.border}`}>
                                                {m.status === 'OFFLINE' || m.status === 'STOPPED' ? <ZapOff size={18} className={sc.color} /> : <Cpu size={18} className={sc.color} />}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide truncate max-w-[140px]">{m.machineName}</h3>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">{m.location || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl mb-4 border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Temp</span>
                                            <span className={`text-base font-black tabular-nums transition-colors ${m.temperature > 85 ? 'text-amber-400' : 'text-slate-200'}`}>
                                                {m.temperature != null ? `${m.temperature.toFixed(0)}°` : '—'}
                                            </span>
                                        </div>
                                        <div className="w-px h-8 bg-white/10" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Power</span>
                                            <span className="text-base font-black text-slate-200 tabular-nums">
                                                {m.powerConsumption != null ? `${m.powerConsumption.toFixed(1)} kW` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color} flex items-center gap-2 uppercase tracking-wider`}>
                                            {m.status === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                            {m.status === 'EMERGENCY' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                                            {sc.label}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{m.machineType}</span>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
