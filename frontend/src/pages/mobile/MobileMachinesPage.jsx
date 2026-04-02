import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useMachines } from '../../context/MachineContext';
import {
    Cpu, Thermometer, Zap, Activity, AlertTriangle, Play, Square,
    OctagonX, RotateCcw, Wrench, SlidersHorizontal, Settings, ChevronRight,
    MapPin, Box, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'RUNNING' },
    STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', label: 'STOPPED' },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'EMERGENCY' },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'MAINTENANCE' },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', label: 'CALIBRATING' },
    OFFLINE: { color: '#4b5563', bg: 'rgba(75,85,99,0.1)', border: 'rgba(75,85,99,0.3)', label: 'OFFLINE' },
};

const COMMANDS = [
    { cmd: 'START', icon: Play, color: '#22c55e', label: 'START' },
    { cmd: 'STOP', icon: Square, color: '#64748b', label: 'STOP' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, color: '#ef4444', label: 'E-STOP' },
    { cmd: 'RESET', icon: RotateCcw, color: '#a855f7', label: 'RESET' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, color: '#f59e0b', label: 'MAINT' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, color: '#3b82f6', label: 'CALIB' },
];

const MachineCard = ({ machine, handleCommand, cmdLoading }) => {
    const [expanded, setExpanded] = useState(false);
    const sc = STATUS_CONFIG[machine.status] || STATUS_CONFIG.OFFLINE;

    return (
        <div className={`m-control-card ${machine.status === 'RUNNING' ? 'm-control-card--active' : ''} mb-4 overflow-hidden`}>
            <div className="flex justify-between items-start mb-6">
                <Link to={`/app/machines/${machine.machineId}`} className="flex items-center gap-4 flex-1 outline-none">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-inner" style={{ background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>
                        <Cpu size={24} style={{ color: sc.color }} />
                        {machine.status === 'RUNNING' && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 animate-pulse" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black text-white leading-tight">{machine.machineName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest" style={{ color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>
                                {sc.label}
                            </span>
                            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                                <MapPin size={10} /> {machine.location}
                            </div>
                        </div>
                    </div>
                </Link>
                <div className="flex flex-col items-end">
                    <div className="text-xl font-black text-amber-500 tracking-tighter">
                        {machine.temperature?.toFixed(0)}°
                    </div>
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">THERMAL</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">LOAD</div>
                    <div className="text-sm font-black text-sky-400">{machine.powerConsumption?.toFixed(1)}kW</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">OEE</div>
                    <div className="text-sm font-black text-emerald-400">{machine.efficiency?.toFixed(0)}%</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">VIBRATION</div>
                    <div className="text-sm font-black text-indigo-400">NOMINAL</div>
                </div>
            </div>

            <div className="flex gap-3">
                <button className="flex-1 m-btn m-btn--ghost m-btn--large" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ChevronRight size={20} className="rotate-90 transition-transform" /> : <Settings size={20} />}
                    {expanded ? 'HIDE OPS' : 'QUICK OPS'}
                </button>
                <Link to={`/app/machines/${machine.machineId}`} className="w-16 m-btn m-btn--ghost m-btn--large">
                    <Info size={20} />
                </Link>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="mt-6 pt-6 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-3">
                            {COMMANDS.map(c => {
                                const isLoading = cmdLoading[`${machine.machineId}-${c.cmd}`];
                                return (
                                    <button 
                                        key={c.cmd} 
                                        onClick={() => handleCommand(machine.machineId, c.cmd)} 
                                        disabled={isLoading}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 ${isLoading ? 'opacity-50 grayscale' : ''}`}
                                        style={{ color: c.color, borderColor: `${c.color}20`, background: `${c.color}08` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <c.icon size={18} fill={c.cmd === 'START' ? 'currentColor' : 'none'} />
                                            <span className="text-xs font-black tracking-widest">{c.label}</span>
                                        </div>
                                        {isLoading && <RotateCcw size={14} className="animate-spin" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MobileMachinesPage = () => {
    const { machines, setMachines, sendCommand } = useMachines();
    const [filter, setFilter] = useState('all');
    const [cmdLoading, setCmdLoading] = useState({});

    const handleCommand = async (id, cmd) => {
        setCmdLoading(p => ({ ...p, [`${id}-${cmd}`]: true }));
        try {
            await sendCommand(id, cmd);
        } catch (e) {
            console.error('Command failed:', e);
        } finally {
            setTimeout(() => setCmdLoading(p => ({ ...p, [`${id}-${cmd}`]: false })), 800);
        }
    };

    const filters = ['all', 'RUNNING', 'STOPPED', 'EMERGENCY', 'MAINTENANCE'];
    const filtered = filter === 'all' ? machines : machines.filter(m => m.status === filter);

    return (
        <div className="m-dashboard px-6 pb-24">
            <div className="flex justify-between items-end mb-8 pt-4">
                <div>
                    <h1 className="m-dashboard__title !mb-0">Fleet</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Global Node Oversight</p>
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400">
                    <SlidersHorizontal size={20} />
                </div>
            </div>

            <div className="flex overflow-x-auto gap-3 mb-8 no-scrollbar -mx-6 px-6">
                {filters.map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filtered.map((m, i) => (
                        <motion.div 
                            key={m.machineId} 
                            layout 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <MachineCard machine={m} handleCommand={handleCommand} cmdLoading={cmdLoading} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {filtered.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center gap-4 grayscale opacity-20">
                    <Box size={48} className="text-slate-500" />
                    <span className="text-xs font-black tracking-widest uppercase">No matching nodes</span>
                </div>
            )}
        </div>
    );
};

export default MobileMachinesPage;
