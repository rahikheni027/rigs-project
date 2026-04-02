import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useMachines } from '../context/MachineContext';
import {
    ArrowLeft, Thermometer, Activity, Zap, Gauge, Wind, BarChart3, AlertTriangle,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal, Cpu,
    Download, Droplets, Fan, Cog, Radio
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: 'text-green-500', hex: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'RUNNING' },
    STOPPED: { color: 'text-slate-400', hex: '#64748b', bg: 'bg-slate-500/10', border: 'border-slate-500/30', label: 'STOPPED' },
    EMERGENCY: { color: 'text-red-500', hex: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'E-STOP' },
    MAINTENANCE: { color: 'text-amber-500', hex: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'MAINTENANCE' },
    CALIBRATING: { color: 'text-blue-500', hex: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'CALIBRATING' },
    OFFLINE: { color: 'text-gray-500', hex: '#4b5563', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'OFFLINE' },
};

const MACHINE_ICONS = { PUMP: Droplets, MOTOR: Cog, COMPRESSOR: Fan, TURBINE: Activity, GENERATOR: Zap };

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'START', border: 'border-green-500/30', hover: 'hover:bg-green-500/10 hover:border-green-500/50', text: 'text-green-500' },
    { cmd: 'STOP', icon: Square, label: 'STOP', border: 'border-slate-500/30', hover: 'hover:bg-slate-500/10 hover:border-slate-500/50', text: 'text-slate-400' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'E-STOP', border: 'border-red-500/30', hover: 'hover:bg-red-500/10 hover:border-red-500/50', text: 'text-red-500' },
    { cmd: 'RESET', icon: RotateCcw, label: 'RESET', border: 'border-purple-500/30', hover: 'hover:bg-purple-500/10 hover:border-purple-500/50', text: 'text-purple-400' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'MAINT', border: 'border-amber-500/30', hover: 'hover:bg-amber-500/10 hover:border-amber-500/50', text: 'text-amber-500' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, label: 'CALIB', border: 'border-blue-500/30', hover: 'hover:bg-blue-500/10 hover:border-blue-500/50', text: 'text-blue-400' },
];

const SETPOINTS = {
    temperature: { min: 30, max: 85, unit: '°C', label: 'TEMPERATURE' },
    rpm: { min: 0, max: 3600, unit: '', label: 'RPM' },
    vibration: { min: 0, max: 5.0, unit: 'g', label: 'VIBRATION' },
    pressure: { min: 15, max: 120, unit: 'PSI', label: 'PRESSURE' },
    powerConsumption: { min: 0, max: 25, unit: 'kW', label: 'POWER' },
    efficiency: { min: 75, max: 100, unit: '%', label: 'EFFICIENCY' },
    currentDraw: { min: 0, max: 15, unit: 'A', label: 'CURRENT' },
    errorRate: { min: 0, max: 0.05, unit: '', label: 'ERROR RATE' },
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
                    <span className="text-white font-bold">{p.value != null ? Number(p.value).toFixed(2) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

const MetricCard = ({ label, value, unit, icon: Icon, colorClass, hexColor, setpoint }) => {
    const isOverLimit = setpoint && value != null && value > setpoint.max;
    const dpColorText = isOverLimit ? 'text-red-400' : colorClass;
    const dpColorHex = isOverLimit ? '#f87171' : hexColor;

    return (
        <div className={`bg-slate-900/60 backdrop-blur-md border ${isOverLimit ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-slate-800/40'} rounded-2xl p-4 transition-all`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <Icon size={14} className={dpColorText} />
                    <span className="text-[10px] font-bold uppercase font-mono tracking-widest">{label}</span>
                </div>
                {isOverLimit && <AlertTriangle size={12} className="text-red-400 animate-pulse" />}
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-2xl font-black font-mono tracking-tighter ${dpColorText}`}>
                    {value != null ? (typeof value === 'number' ? value.toFixed(label === 'RPM' ? 0 : 2) : value) : '--'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{unit}</span>
            </div>
            {setpoint && (
                <div className="flex justify-between items-center text-[9px] font-mono font-bold tracking-widest pt-3 border-t border-white/5">
                    <span className="text-slate-500">SP: {setpoint.min}-{setpoint.max}{unit}</span>
                    {value != null && (
                        <span className={isOverLimit ? 'text-red-400 animate-pulse' : 'text-green-400'}>{isOverLimit ? '▲ HIGH' : '✓ NORM'}</span>
                    )}
                </div>
            )}
        </div>
    );
};

const VirtualMachineVisualizer = ({ status, type, sc }) => {
    const isRunning = status === 'RUNNING';
    const isError = status === 'EMERGENCY';

    return (
        <div className={`bg-slate-900/40 border ${sc.border} rounded-3xl p-6 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden`}>
            <motion.div animate={{ opacity: isRunning ? [0.2, 0.4, 0.2] : isError ? [0.3, 0.6, 0.3] : 0.1 }} transition={{ duration: isError ? 0.5 : 2, repeat: Infinity }} 
                className={`absolute w-40 h-40 ${sc.bg} rounded-full blur-[40px]`}></motion.div>
            
            <motion.div animate={{ rotate: isRunning ? 360 : 0 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`relative z-10 w-24 h-24 border-[3px] border-dashed ${sc.border} rounded-full flex items-center justify-center bg-slate-900/80 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                <Cog size={40} className={sc.color} />
            </motion.div>
            
            <div className="relative z-10 mt-6 text-center">
                <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase font-mono">{type || 'MACHINE'}</h3>
                <motion.div animate={isError ? { opacity: [1, 0, 1] } : {}} transition={{ duration: 0.5, repeat: Infinity }}
                    className={`text-[11px] font-bold tracking-[0.3em] font-mono mt-2 uppercase ${sc.color}`}>
                    [{status}]
                </motion.div>
            </div>
        </div>
    );
};

const MachineDetailPage = () => {
    const { machineId } = useParams();
    const { machines } = useMachines();
    const liveMachine = machines?.find(m => m.machineId === machineId);
    
    const [machine, setMachine] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cmdLoading, setCmdLoading] = useState({});
    const [pendingCmd, setPendingCmd] = useState(null);
    const [forceOverride, setForceOverride] = useState(false);

    useEffect(() => {
        const fetchInitialInfo = async () => {
            try {
                const [machRes, histRes] = await Promise.all([
                    api.get(`/machines/${machineId}/telemetry`),
                    api.get(`/machines/${machineId}/telemetry/history`),
                ]);
                setMachine(machRes.data);
                
                const histData = (histRes.data || []).slice(-40).map((d, i) => ({
                    time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : `T${i}`,
                    temp: d.temperature, vib: d.vibration, rpm: d.rpm, pres: d.pressure, power: d.powerConsumption, eff: d.efficiency, cur: d.currentDraw, err: d.errorRate,
                }));
                setHistory(histData);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchInitialInfo();
    }, [machineId]);

    useEffect(() => {
        if (!liveMachine) return;
        setMachine(prev => ({ ...prev, ...liveMachine }));
        
        setHistory(prev => {
            const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            if (prev.length > 0 && prev[prev.length - 1].time === now) return prev;
            
            const next = [...prev, { time: now, temp: liveMachine.temperature, vib: liveMachine.vibration, rpm: liveMachine.rpm, pres: liveMachine.pressure, power: liveMachine.powerConsumption, eff: liveMachine.efficiency, cur: liveMachine.currentDraw, err: liveMachine.errorRate }];
            return next.length > 50 ? next.slice(-50) : next;
        });
    }, [liveMachine]);

    const handleCommandClick = (cmd) => {
        const isStop = ['STOP', 'EMERGENCY_STOP', 'MAINTENANCE_MODE'].includes(cmd);
        const hasDownstream = machine?.downstreamDependencies?.length > 0;
        if (isStop && hasDownstream) { setPendingCmd(cmd); return; }
        executeCommand(cmd, forceOverride);
    };

    const executeCommand = async (cmd, force) => {
        setPendingCmd(null);
        setCmdLoading(p => ({ ...p, [cmd]: true }));
        const tStat = cmd === 'START' || cmd === 'RESET' ? 'RUNNING' : cmd === 'STOP' ? 'STOPPED' : cmd === 'EMERGENCY_STOP' ? 'EMERGENCY' : cmd === 'MAINTENANCE_MODE' ? 'MAINTENANCE' : cmd === 'CALIBRATION' ? 'CALIBRATING' : null;
        if (tStat && machine) setMachine(prev => ({ ...prev, status: tStat }));

        try { await api.post(`/machines/${machineId}/command?command=${cmd}&issuedBy=operator&force=${force}`); }
        catch (e) { if (liveMachine) setMachine(prev => ({ ...prev, status: liveMachine.status })); }
        finally { setTimeout(() => setCmdLoading(p => ({ ...p, [cmd]: false })), 1200); }
    };

    const exportCSV = () => {
        const headers = ['Time', 'Temp', 'RPM', 'Vibration', 'Pressure', 'Power', 'Efficiency', 'Current', 'ErrorRate'];
        const rows = history.map(d => [d.time, d.temp?.toFixed(1), d.rpm?.toFixed(0), d.vib?.toFixed(2), d.pres?.toFixed(1), d.power?.toFixed(2), d.eff?.toFixed(1), d.cur?.toFixed(1), d.err?.toFixed(3)]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `rigs_node_${machineId}_log.csv`; a.click();
    };

    if (loading || !machine) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Gauge size={22} className="text-sky-400 animate-spin-slow" />
            </div>
            <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase">Acquiring Node Telemetry...</p>
        </div>
    );

    const sc = STATUS_CONFIG[machine.status] || STATUS_CONFIG.OFFLINE;
    const MIcon = MACHINE_ICONS[machine.machineType] || Cpu;
    const tSince = machine.lastHeartbeat ? Math.round((Date.now() - new Date(machine.lastHeartbeat).getTime()) / 1000) : null;

    return (
        <div className="pb-10 font-sans text-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 mt-2">
                <div className="flex items-start md:items-center gap-4">
                    <Link to="/app/machines" className="p-3 bg-slate-900/60 border border-white/5 hover:border-slate-500/50 hover:bg-slate-800 rounded-xl transition-all">
                        <ArrowLeft size={18} className="text-slate-400" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <MIcon size={20} className={sc.color} />
                            <h1 className="text-2xl md:text-3xl font-black text-white uppercase font-mono tracking-tighter m-0">{machine.machineName}</h1>
                            <span className={`text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5 rounded-lg uppercase tracking-widest border ${sc.bg} ${sc.color} ${sc.border} font-mono`}>
                                {machine.status === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                {machine.status === 'EMERGENCY' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                                {sc.label}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-2">
                            {machine.location} • {machine.machineType} • Uptime {(machine.cumulativeRuntimeHours || 0).toFixed(1)}h
                            {tSince !== null && <span className={`ml-2 px-1.5 py-0.5 rounded ${tSince > 30 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>T-{tSince}s</span>}
                        </div>
                    </div>
                </div>
                <button onClick={exportCSV} className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-sky-400 text-xs font-bold font-mono tracking-widest uppercase transition-colors shrink-0">
                    <Download size={14} /> Export Logs
                </button>
            </div>

            {/* Cascade Warning Modal */}
            <AnimatePresence>
                {pendingCmd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                            <div className="flex items-center gap-3 mb-4 text-red-500">
                                <AlertTriangle size={28} className="animate-pulse" />
                                <h2 className="text-xl font-black font-mono tracking-tighter uppercase">Dependency Override Warning</h2>
                            </div>
                            <p className="text-slate-300 font-medium mb-4 leading-relaxed">
                                Issuing <span className="text-red-400 font-bold px-1.5 py-0.5 bg-red-500/10 rounded">{pendingCmd}</span> directly to this node will trigger a cascading lock down of 
                                <span className="text-white font-black"> {machine?.downstreamDependencies?.length} downstream operational units</span>.
                            </p>
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-8">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono mb-2">Affected Targets:</div>
                                <div className="flex flex-wrap gap-2 text-sm text-red-400 font-mono font-bold">
                                    {machine?.downstreamDependencies?.map(id => <span key={id} className="bg-red-500/10 px-2 py-1 rounded">M-{id}</span>)}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 font-mono">
                                <button onClick={() => setPendingCmd(null)} className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold tracking-widest uppercase hover:bg-slate-700 transition">Abort</button>
                                <button onClick={() => executeCommand(pendingCmd, forceOverride)} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black tracking-widest uppercase transition shadow-[0_0_15px_rgba(239,68,68,0.4)]">Enforce Lock</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Top Config Row: Visualizer & Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <VirtualMachineVisualizer status={machine.status} type={machine.machineType} sc={sc} />
                
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                    <h2 className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <SlidersHorizontal size={14} /> Master Operational Link
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {COMMANDS.map(c => {
                            const isActive = cmdLoading[c.cmd];
                            return (
                                <button key={c.cmd} onClick={() => handleCommandClick(c.cmd)} disabled={isActive}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 bg-slate-900/80
                                    ${isActive ? 'opacity-50 scale-95' : `hover:-translate-y-1 ${c.hover} cursor-pointer`} ${c.border}`}>
                                    <div className={`mb-2 ${isActive ? 'opacity-50' : c.text}`}>
                                        <c.icon size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold font-mono tracking-widest uppercase ${isActive ? 'text-slate-500' : c.text}`}>{c.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Force Override Toggle */}
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${forceOverride ? 'bg-red-500/10 border-red-500/30' : 'bg-black/20 border-white/5'}`}>
                        <input type="checkbox" id="override" checked={forceOverride} onChange={e => setForceOverride(e.target.checked)} className="w-4 h-4 cursor-pointer accent-red-500" />
                        <label htmlFor="override" className={`text-[10px] font-bold font-mono uppercase tracking-widest cursor-pointer select-none transition-colors ${forceOverride ? 'text-red-400' : 'text-slate-500'}`}>
                            Safety Restraint Override
                        </label>
                    </div>
                </div>
            </div>

            {/* Matrix Metrics */}
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Core Telemetry</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
                <MetricCard label="TEMP" value={machine.temperature} unit="°C" icon={Thermometer} colorClass="text-amber-500" hexColor="#f59e0b" setpoint={SETPOINTS.temperature} />
                <MetricCard label="RPM" value={machine.rpm} unit="" icon={Gauge} colorClass="text-blue-500" hexColor="#3b82f6" setpoint={SETPOINTS.rpm} />
                <MetricCard label="VIBE" value={machine.vibration} unit="g" icon={Activity} colorClass="text-purple-500" hexColor="#a855f7" setpoint={SETPOINTS.vibration} />
                <MetricCard label="PRES" value={machine.pressure} unit="PSI" icon={Wind} colorClass="text-cyan-500" hexColor="#06b6d4" setpoint={SETPOINTS.pressure} />
                <MetricCard label="LOAD" value={machine.powerConsumption} unit="kW" icon={Zap} colorClass="text-indigo-500" hexColor="#6366f1" setpoint={SETPOINTS.powerConsumption} />
                <MetricCard label="RATE" value={machine.efficiency} unit="%" icon={BarChart3} colorClass="text-green-500" hexColor="#22c55e" setpoint={SETPOINTS.efficiency} />
                <MetricCard label="AMP" value={machine.currentDraw} unit="A" icon={Radio} colorClass="text-pink-500" hexColor="#ec4899" setpoint={SETPOINTS.currentDraw} />
                <MetricCard label="ERR" value={machine.errorRate} unit="%" icon={AlertTriangle} colorClass="text-red-500" hexColor="#ef4444" setpoint={SETPOINTS.errorRate} />
            </div>

            {/* Historical Trending */}
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Oscilloscope Diagnostics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* Temp & Vibration Chart */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest mb-4">Thermodynamic vs Kinematic</h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis yAxisId="temp" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                                <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tg)" strokeWidth={3} name="Temp (°C)" dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 3 }} />
                                <Line yAxisId="vib" type="monotone" dataKey="vib" stroke="#a855f7" strokeWidth={3} name="Vib (g)" dot={false} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Electromechanical Chart */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest mb-4">Electromechanical Stress</h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis yAxisId="rpm" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                                <YAxis yAxisId="pwr" orientation="right" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#3b82f6" fill="url(#rg)" strokeWidth={3} name="RPM" dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 3 }} />
                                <Line yAxisId="pwr" type="monotone" dataKey="power" stroke="#6366f1" strokeWidth={3} name="Power (kW)" dot={false} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
            
            {/* Dependency Mapping */}
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">P&ID Topological Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest mb-4">Upstream Parents (Requisite)</h3>
                    <div className="flex flex-wrap gap-3">
                        {machine.upstreamDependencies?.length > 0 ? machine.upstreamDependencies.map(id => (
                            <Link key={id} to={`/app/machines/${id}`} className="bg-slate-800 border border-slate-700 hover:border-sky-500 hover:text-sky-400 transition-colors text-slate-300 px-4 py-2 rounded-xl text-xs font-mono font-bold">M-{id}</Link>
                        )) : <span className="text-slate-500 text-xs font-mono font-bold bg-black/20 px-4 py-2 rounded-xl border border-white/5">NONE (SOURCE NODE)</span>}
                    </div>
                </div>
                
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest mb-4">Downstream Children (Dependent)</h3>
                    <div className="flex flex-wrap gap-3">
                        {machine.downstreamDependencies?.length > 0 ? machine.downstreamDependencies.map(id => (
                            <Link key={id} to={`/app/machines/${id}`} className="bg-slate-800 border border-slate-700 hover:border-red-500 hover:text-red-400 transition-colors text-slate-300 px-4 py-2 rounded-xl text-xs font-mono font-bold">M-{id}</Link>
                        )) : <span className="text-slate-500 text-xs font-mono font-bold bg-black/20 px-4 py-2 rounded-xl border border-white/5">NONE (SINK NODE)</span>}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MachineDetailPage;
