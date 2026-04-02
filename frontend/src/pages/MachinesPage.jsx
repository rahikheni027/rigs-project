import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMachines } from '../context/MachineContext';
import {
    Thermometer, Activity, Zap, Gauge, Wind, AlertTriangle,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal,
    Cpu, ChevronRight, Signal, Droplets, Fan, Cog, Download
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'RUNNING', pulse: true },
    STOPPED: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', label: 'STOPPED', pulse: false },
    EMERGENCY: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'EMERGENCY', pulse: true },
    MAINTENANCE: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'MAINTENANCE', pulse: false },
    CALIBRATING: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'CALIBRATING', pulse: true },
    OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'OFFLINE', pulse: false },
};

const MACHINE_ICONS = { PUMP: Droplets, MOTOR: Cog, COMPRESSOR: Fan, TURBINE: Activity, GENERATOR: Zap };

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'Start', cStr: 'text-green-500 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/40' },
    { cmd: 'STOP', icon: Square, label: 'Stop', cStr: 'text-slate-400 border-slate-500/20 hover:bg-slate-500/10 hover:border-slate-500/40' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'E-Stop', cStr: 'text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40' },
    { cmd: 'RESET', icon: RotateCcw, label: 'Reset', cStr: 'text-purple-400 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'Maint.', cStr: 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, label: 'Calibrate', cStr: 'text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40' },
];

const GaugeBar = ({ value, max, colorClass, barColor, label, unit, warn }) => {
    const pct = Math.min(((value || 0) / max) * 100, 100);
    const isWarn = warn && (value || 0) > warn;
    const finalColor = isWarn ? 'text-red-400' : colorClass;
    
    return (
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">{label}</span>
                <span className={`text-xs font-bold font-mono ${finalColor}`}>
                    {value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '--'}
                    {unit && <span className="text-[8px] font-normal text-slate-500 ml-0.5">{unit}</span>}
                </span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isWarn ? 'bg-gradient-to-r from-amber-500 to-red-500' : barColor}`} 
                    style={{ width: `${pct}%` }} 
                />
            </div>
        </div>
    );
};

const MachinesPage = () => {
    const { machines, setMachines } = useMachines();
    const [filter, setFilter] = useState('all');
    const [cmdLoading, setCmdLoading] = useState({});
    const { user } = useAuth();

    const handleCommand = async (id, cmd) => {
        setCmdLoading(p => ({ ...p, [`${id}-${cmd}`]: true }));
        const tStat = cmd === 'START' || cmd === 'RESET' ? 'RUNNING' : cmd === 'STOP' ? 'STOPPED' : cmd === 'EMERGENCY_STOP' ? 'EMERGENCY' : cmd === 'MAINTENANCE_MODE' ? 'MAINTENANCE' : cmd === 'CALIBRATION' ? 'CALIBRATING' : null;
        if (tStat) setMachines(prev => prev.map(m => m.machineId === id ? { ...m, status: tStat } : m));

        try {
            await api.post(`/machines/${id}/command?command=${cmd}&issuedBy=${user?.name || 'operator'}`);
        } catch (e) {
            console.error('Command failed:', e);
        } finally {
            setTimeout(() => setCmdLoading(p => ({ ...p, [`${id}-${cmd}`]: false })), 1200);
        }
    };

    const exportCSV = () => {
        const headers = ['Machine', 'Status', 'Type', 'Location', 'Temp(°C)', 'RPM', 'Vibration(g)', 'Pressure(PSI)', 'Power(kW)', 'Efficiency(%)', 'ErrorRate'];
        const rows = machines.map(m => [m.machineName, m.status, m.machineType || 'N/A', m.location, m.temperature?.toFixed(1) || '', m.rpm?.toFixed(0) || '', m.vibration?.toFixed(2) || '', m.pressure?.toFixed(1) || '', m.powerConsumption?.toFixed(2) || '', m.efficiency?.toFixed(1) || '', m.errorRate?.toFixed(3) || '']);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `rigs_machines_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const filters = ['all', 'RUNNING', 'STOPPED', 'EMERGENCY', 'MAINTENANCE', 'CALIBRATING'];
    const filtered = filter === 'all' ? machines : machines.filter(m => m.status === filter);
    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length).toFixed(1) : '--';
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0).toFixed(1);

    if (!machines || machines.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Cpu size={22} className="text-sky-400 animate-pulse" />
            </div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">WAKING UP PROCESS NODES...</p>
        </div>
    );

    return (
        <div className="pb-10 font-sans text-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight font-mono uppercase text-white m-0">Fleet Command Center</h1>
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-md px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                            <span className="text-[10px] font-bold text-green-400 font-mono tracking-widest">LIVE BROADCAST</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Direct process node intervention and oversight</p>
                </div>
                <button onClick={exportCSV} className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-sky-400 text-xs font-bold font-mono tracking-widest uppercase transition-colors shrink-0">
                    <Download size={14} /> Export CSV
                </button>
            </div>

            {/* KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {[
                    { label: 'Total Nodes', value: machines.length, icon: Cpu, cText: 'text-sky-400', cBg: 'bg-sky-400/10', cBorder: 'border-sky-400/20' },
                    { label: 'Running', value: runCount, icon: Signal, cText: 'text-green-400', cBg: 'bg-green-400/10', cBorder: 'border-green-400/20' },
                    { label: 'Alerts', value: alertCount, icon: AlertTriangle, cText: alertCount > 0 ? 'text-red-400' : 'text-slate-400', cBg: alertCount > 0 ? 'bg-red-400/10' : 'bg-slate-400/10', cBorder: alertCount > 0 ? 'border-red-400/20' : 'border-slate-400/20' },
                    { label: 'Avg Temp', value: `${avgTemp}°C`, icon: Thermometer, cText: 'text-amber-400', cBg: 'bg-amber-400/10', cBorder: 'border-amber-400/20' },
                    { label: 'Fleet Load', value: `${totalPower} kW`, icon: Zap, cText: 'text-purple-400', cBg: 'bg-purple-400/10', cBorder: 'border-purple-400/20' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-xl p-3 flex items-center gap-3 shadow-lg">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.cBg} border ${kpi.cBorder}`}>
                            <kpi.icon size={18} className={kpi.cText} />
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono mb-0.5">{kpi.label}</div>
                            <div className={`text-lg font-black font-mono tracking-tight ${kpi.cText}`}>{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {filters.map(f => {
                    const count = f === 'all' ? machines.length : machines.filter(m => m.status === f).length;
                    const isActive = filter === f;
                    return (
                        <button key={f} onClick={() => setFilter(f)} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold font-mono tracking-widest uppercase whitespace-nowrap transition-all border ${isActive ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'bg-slate-900/40 border-slate-700 hover:bg-slate-800 text-slate-400'}`}>
                            {f === 'all' ? 'FULL FLEET' : f} <span className="ml-1 opacity-60">({count})</span>
                        </button>
                    );
                })}
            </div>

            {/* Machine Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {filtered.map(m => {
                    const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                    const MIcon = MACHINE_ICONS[m.machineType] || Cpu;
                    
                    return (
                        <div key={m.machineId} className={`bg-slate-900/60 backdrop-blur-xl border ${sc.border} rounded-2xl overflow-hidden flex flex-col group transition-all hover:-translate-y-1 hover:shadow-2xl shadow-lg relative`}>
                            
                            {/* Glowing Background gradient */}
                            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none" style={{ background: sc.color.replace('text-', '') }}></div>
                            
                            {/* Top Status Strip */}
                            <div className={`h-1 w-full ${sc.bg} opacity-50`}></div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-5 pb-4 border-b border-white/5 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sc.bg} ${sc.border} shadow-inner`}>
                                            <MIcon size={18} className={sc.color} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white tracking-wide uppercase truncate w-32 sm:w-40">{m.machineName}</h3>
                                            <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1">
                                                {m.location} • {m.machineType}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`text-[9px] font-bold px-2 py-1 flex items-center gap-1.5 rounded-md uppercase tracking-widest border ${sc.bg} ${sc.color} ${sc.border}`}>
                                            {sc.pulse && <span className={`w-1.5 h-1.5 rounded-full bg-current ${m.status === 'EMERGENCY' ? 'animate-ping' : 'animate-pulse'}`} />}
                                            {sc.label}
                                        </div>
                                        <Link to={`/app/machines/${m.machineId}`} className="text-[10px] text-sky-400 hover:text-sky-300 font-bold tracking-widest uppercase flex items-center gap-1 font-mono transition-colors">
                                            Telemetry <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>

                                {/* Gauges */}
                                <div className="space-y-4 mb-6 flex-1 relative z-10">
                                    <div className="flex gap-4">
                                        <GaugeBar value={m.temperature} max={120} colorClass="text-amber-400" barColor="bg-gradient-to-r from-amber-500/50 to-amber-400" label="Temp" unit="°C" warn={85} />
                                        <GaugeBar value={m.rpm} max={4000} colorClass="text-blue-400" barColor="bg-gradient-to-r from-blue-600/50 to-blue-400" label="RPM" />
                                        <GaugeBar value={m.vibration} max={10} colorClass="text-purple-400" barColor="bg-gradient-to-r from-purple-600/50 to-purple-400" label="Vibration" unit="g" warn={5} />
                                    </div>
                                    <div className="flex gap-4">
                                        <GaugeBar value={m.pressure} max={150} colorClass="text-cyan-400" barColor="bg-gradient-to-r from-cyan-600/50 to-cyan-400" label="Pressure" unit="PSI" warn={100} />
                                        <GaugeBar value={m.powerConsumption} max={30} colorClass="text-indigo-400" barColor="bg-gradient-to-r from-indigo-500/50 to-indigo-400" label="Power" unit="kW" />
                                        <GaugeBar value={m.efficiency} max={100} colorClass="text-green-400" barColor="bg-gradient-to-r from-green-600/50 to-green-400" label="Safety / OEE" unit="%" />
                                    </div>
                                </div>

                                {/* Control Deck */}
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-auto relative z-10">
                                    {COMMANDS.map(c => {
                                        const loadingKey = `${m.machineId}-${c.cmd}`;
                                        const isActive = cmdLoading[loadingKey];
                                        return (
                                            <button key={c.cmd} onClick={() => handleCommand(m.machineId, c.cmd)} disabled={isActive}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 
                                                ${isActive ? 'opacity-50 scale-95' : 'hover:-translate-y-0.5 shadow-sm'} ${c.cStr}`}>
                                                <c.icon size={12} className="mb-1" />
                                                <span className="text-[8px] font-bold font-mono tracking-widest uppercase truncate w-full text-center">{c.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MachinesPage;
