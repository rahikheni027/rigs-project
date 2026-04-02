import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useMachines } from '../context/MachineContext';
import ProcessFlowDiagram from '../components/ProcessFlowDiagram';
import {
    Cpu, Thermometer, Activity, Zap, Shield, Signal, 
    AlertTriangle, BarChart3, Wifi, Droplets, Fan, Cog, 
    ArrowUpRight, ArrowDownRight, Wind, ZapOff, Clock
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', label: 'RUN' },
    STOPPED: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', glow: '', label: 'STOP' },
    EMERGENCY: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]', label: 'E-STOP' },
    MAINTENANCE: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: '', label: 'MAINT' },
    CALIBRATING: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: '', label: 'CAL' },
    OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', glow: '', label: 'OFF' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl font-mono text-xs">
            <div className="text-slate-400 font-bold mb-2 tracking-wider">{label}</div>
            {payload.map(p => (
                <div key={p.name} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-300">{p.name}:</span>
                    <span className="text-white font-bold">{p.value != null ? Number(p.value).toFixed(1) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

const OEEGauge = ({ value }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const colorClass = value >= 85 ? 'text-green-500 bg-green-500/10' : value >= 60 ? 'text-amber-500 bg-amber-500/10' : 'text-red-500 bg-red-500/10';
    const strokeColor = value >= 85 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
    const label = value >= 85 ? 'WORLD CLASS' : value >= 60 ? 'ACCEPTABLE' : 'CRITICAL LOW';

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-white/10 rounded-3xl relative overflow-hidden group">
            <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${colorClass}`}></div>
            
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle cx="50" cy="50" r={radius} fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-white font-sans tracking-tighter">{value.toFixed(1)}<span className="text-base text-slate-400">%</span></span>
                </div>
            </div>
            
            <div className="text-center relative z-10 mt-2">
                <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em] mb-1">OVERALL EQUIPMENT</h3>
                <h4 className="text-[10px] font-black tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full">{label}</h4>
            </div>
        </div>
    );
};

const WorkerDashboard = () => {
    const { machines, dependencyGraph, cascadingFailure } = useMachines();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    const fetchAlerts = async () => {
        try {
            const alertRes = await api.get('/alerts?size=10');
            setAlerts(alertRes.data.content || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAlerts();
        const t = setInterval(fetchAlerts, 10000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!machines || machines.length === 0) return;
        setChartData(prev => {
            const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            if (prev.length > 0 && prev[prev.length - 1].time === now) return prev;

            const avgTemp = machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length;
            const avgVib = machines.reduce((s, m) => s + (m.vibration || 0), 0) / machines.length;
            const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0);
            
            const next = [...prev, { time: now, temp: avgTemp, vib: avgVib, power: totalPower }];
            return next.length > 30 ? next.slice(-30) : next;
        });
    }, [machines]);

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const runningMachines = machines.filter(m => m.status === 'RUNNING');
    const avgEfficiency = runningMachines.length ? (runningMachines.reduce((s, m) => s + (m.efficiency || 0), 0) / runningMachines.length) : 0;
    const activeAlerts = alerts.filter(a => !a.acknowledged);

    // OEE Calculation: Availability × Performance × Quality
    const availability = machines.length > 0 ? (runCount / machines.length) * 100 : 0;
    const performance = avgEfficiency; 
    const quality = runningMachines.length > 0 ? 100 - (runningMachines.reduce((s, m) => s + (m.errorRate || 0), 0) / runningMachines.length) * 100 : 100;
    const oee = (availability * performance * quality) / 10000;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl animate-pulse"></div>
                <Signal size={32} className="text-sky-400 animate-pulse relative z-10" />
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wider uppercase font-mono">Loading SCADA Grid...</p>
        </div>
    );

    return (
        <div className="pb-10 font-sans text-slate-50 min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Shift Operations</h1>
                        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                            <Wifi size={12} className="text-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">P&ID Active</span>
                        </div>
                    </div>
                    <p className="text-slate-400 font-medium text-sm md:text-base">Plant floor visualization and dependencies</p>
                </div>
                
                {cascadingFailure && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                        className="flex items-center gap-3 bg-red-500/20 backdrop-blur-md px-4 py-2 bg-gradient-to-r from-red-600/30 to-red-900/30 rounded-xl border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <AlertTriangle size={18} className="text-red-400 animate-pulse" />
                        <span className="text-sm text-red-200 font-bold tracking-wider">CASCADE FAILURE DETECTED</span>
                    </motion.div>
                )}
            </div>

            {/* Top Grid Area: OEE Gauge + Flow Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <OEEGauge value={oee} />
                    
                    {/* Compact stats block */}
                    <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-bl-full blur-2xl"></div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Core Metrics</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400 font-medium tracking-wide">Availability</span>
                                    <span className="text-white font-bold">{availability.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${availability}%` }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400 font-medium tracking-wide">Performance</span>
                                    <span className="text-white font-bold">{performance.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${performance}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400 font-medium tracking-wide">Quality Rate</span>
                                    <span className="text-white font-bold">{quality.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${quality}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[400px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none text-sky-500"><Wind size={80} /></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Activity size={16} className="text-slate-400" />
                            Dynamic Process flow
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">AUTOSYNC: ACTIVE</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 overflow-hidden relative z-10">
                        {dependencyGraph && <ProcessFlowDiagram nodes={dependencyGraph.nodes} edges={dependencyGraph.edges} />}
                    </div>
                </div>

                {/* Desktop Specific: Live Event Ticker */}
                <div className="hidden lg:flex lg:col-span-1 flex-col bg-slate-950/40 border border-white/5 rounded-3xl p-5 shadow-inner">
                    <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Signal size={12} className="text-sky-400" /> Live Telemetry
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {machines.slice(0, 10).map(m => (
                            <div key={m.machineId} className="flex flex-col gap-1 p-2 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-300 font-bold truncate pr-2">{m.machineName}</span>
                                    <span className="text-sky-400 font-mono text-[8px]">{m.status.slice(0,4)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-0.5 bg-sky-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500" style={{ width: `${(m.temperature || 0) / 1.2}%` }}></div>
                                    </div>
                                    <div className="flex-1 h-0.5 bg-indigo-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${m.efficiency || 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Trends & Alarms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                
                {/* Dual Area Chart */}
                <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={16} className="text-slate-400" />
                            Process Output Streams
                        </h2>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div> Power Draw</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div> Fleet Temp</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="pC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="tC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis yAxisId="pwr" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                                <YAxis yAxisId="tmp" orientation="right" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area yAxisId="pwr" type="monotone" dataKey="power" stroke="#6366f1" fill="url(#pC)" strokeWidth={3} name="Power (kW)" dot={false} activeDot={{ r: 6, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 3 }} />
                                <Area yAxisId="tmp" type="monotone" dataKey="temp" stroke="#f43f5e" fill="url(#tC)" strokeWidth={3} name="Temp (°C)" dot={false} activeDot={{ r: 6, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Alarms Ledger */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[450px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} className="text-slate-400" />
                            Alarm Ledger
                        </h2>
                        {activeAlerts.length > 0 && <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">{activeAlerts.length} ACTV</span>}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        <AnimatePresence>
                            {activeAlerts.length > 0 ? activeAlerts.slice(0, 8).map((a, i) => {
                                const isCrit = a.severity === 'CRITICAL';
                                const cStr = isCrit ? 'text-red-400 bg-red-500/10 border-red-500/30' : 
                                            a.severity === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 
                                            'text-sky-400 bg-sky-500/10 border-sky-500/30';
                                
                                return (
                                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                                        className={`flex items-start gap-4 p-4 rounded-2xl border ${cStr} backdrop-blur-md`}>
                                        <AlertTriangle size={16} className={`mt-0.5 ${isCrit ? 'text-red-400' : 'text-amber-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-white mb-1 leading-snug">{a.message}</div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">{a.machineName}</span>
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-black/20 opacity-80">{a.severity}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-12 h-12 rounded-full border border-dashed border-slate-600 flex items-center justify-center mb-3">
                                        <Shield size={20} className="text-emerald-500/50" />
                                    </div>
                                    <span className="text-xs font-bold tracking-widest uppercase">System Nominal</span>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            {/* Minimal Node Matrix */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                    <Cog size={16} className="text-slate-400" />
                    <h2 className="text-sm text-slate-300 font-bold uppercase tracking-widest">Process Node Matrix</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {machines.map(m => {
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                        return (
                            <Link key={m.machineId} to={`/app/machines/${m.machineId}`} 
                                className={`flex flex-col p-3 rounded-xl border transition-all duration-200 hover:scale-105 bg-slate-800/40 hover:bg-slate-800/80 ${sc.border} ${sc.glow}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${sc.bg} ${sc.border}`}>
                                        <Cog size={14} className={sc.color} />
                                    </div>
                                    <span className={`w-2 h-2 rounded-full bg-current ${sc.color} ${m.status === 'RUNNING' ? 'animate-pulse' : ''}`}></span>
                                </div>
                                <div className="text-xs font-bold text-white truncate">{m.machineName}</div>
                                <div className="text-[9px] font-mono font-bold text-slate-500 mt-0.5">{sc.label}</div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
