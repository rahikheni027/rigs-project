import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useMachines } from '../../context/MachineContext';
import {
    ArrowLeft, Thermometer, Activity, Zap, Gauge, Wind, BarChart3, AlertTriangle,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal, Cpu,
    Droplets, Fan, Cog, Radio, RadioReceiver, ShieldAlert, ChevronDown, ChevronUp,
    Binary, ShieldCheck, Info, Share2, MoreVertical
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'RUNNING' },
    STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', label: 'STOPPED' },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'EMERGENCY' },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'MAINTENANCE' },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', label: 'CALIBRATING' },
    OFFLINE: { color: '#4b5563', bg: 'rgba(75,85,99,0.1)', border: 'rgba(75,85,99,0.3)', label: 'OFFLINE' },
};

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'START', color: '#22c55e' },
    { cmd: 'STOP', icon: Square, label: 'STOP', color: '#64748b' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'E-STOP', color: '#ef4444' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'MAINT', color: '#f59e0b' },
];

const MetricTile = ({ label, value, unit, icon: Icon, color }) => (
    <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <div className="p-2 rounded-xl" style={{ background: `${color}15` }}><Icon size={16} style={{ color }} /></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{value != null ? value.toFixed(1) : '--'}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">{unit}</span>
        </div>
    </div>
);

const MobileMachineDetailPage = () => {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const { machines, sendCommand } = useMachines();
    const liveMachine = machines?.find(m => m.machineId === machineId);
    
    const [machine, setMachine] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cmdLoading, setCmdLoading] = useState({});
    const [pendingCmd, setPendingCmd] = useState(null);
    const [forceOverride, setForceOverride] = useState(false);
    const [activeTab, setActiveTab] = useState('metrics'); // metrics, chart, ops
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        const fetchInitialInfo = async () => {
            try {
                const [machRes, histRes] = await Promise.all([
                    api.get(`/machines/${machineId}/telemetry`),
                    api.get(`/machines/${machineId}/telemetry/history`),
                ]);
                setMachine(machRes.data);
                
                const histData = (histRes.data || []).slice(-30).map((d, i) => ({
                    time: i, temp: d.temperature, pwr: d.powerConsumption
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
            const next = [...prev, { time: Date.now(), temp: liveMachine.temperature, pwr: liveMachine.powerConsumption }];
            return next.length > 30 ? next.slice(-30) : next;
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
        try { 
            await sendCommand(machineId, cmd);
        }
        catch (e) { console.error(e); }
        finally { setTimeout(() => setCmdLoading(p => ({ ...p, [cmd]: false })), 800); }
    };

    if (loading || !machine) return (
        <div className="mobile-loading">
            <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 shadow-xl shadow-sky-500/10">
                <RadioReceiver size={32} color="#0ea5e9" className="animate-pulse" />
            </div>
            <p className="text-[10px] font-black tracking-[0.4em] text-sky-400 mt-6 uppercase">Syncing Uplink...</p>
        </div>
    );

    const sc = STATUS_CONFIG[machine.status] || STATUS_CONFIG.OFFLINE;

    return (
        <div className="m-dashboard px-0 pb-24">
            {/* Native-style Sticky Header */}
            <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-400 active:bg-white/10">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm font-black text-white tracking-tight uppercase leading-none">{machine.machineName}</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${machine.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{sc.label}</span>
                    </div>
                </div>
                <button className="w-10 h-10 flex items-center justify-center text-slate-400 active:bg-white/5 rounded-full">
                    <MoreVertical size={20} />
                </button>
            </div>

            <div className="px-6 pt-6">
                {/* Visualizer Hero */}
                <div className="mb-8 p-8 rounded-[40px] bg-white/5 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-grid-white/[0.2]" />
                    <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center relative shadow-2xl transition-all duration-700 ${machine.status === 'RUNNING' ? 'scale-110' : 'scale-100'}`} 
                        style={{ background: `${sc.color}15`, border: `2px solid ${sc.color}40`, boxShadow: `0 20px 40px ${sc.color}20` }}>
                        <Cog size={64} style={{ color: sc.color }} className={machine.status === 'RUNNING' ? 'animate-spin-slow' : ''} />
                    </div>
                </div>

                {/* Premium Segmented Control */}
                <div className="flex p-1.5 bg-white/5 rounded-3xl border border-white/5 mb-8">
                    <button className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all tracking-widest ${activeTab === 'metrics' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500'}`} onClick={() => setActiveTab('metrics')}>METRICS</button>
                    <button className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all tracking-widest ${activeTab === 'chart' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500'}`} onClick={() => setActiveTab('chart')}>TRENDS</button>
                    <button className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all tracking-widest ${activeTab === 'ops' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500'}`} onClick={() => setActiveTab('ops')}>CONTROL</button>
                </div>

                {/* Content Area */}
                <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'metrics' && (
                            <motion.div key="metrics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-2 gap-4">
                                <MetricTile label="Temp" value={machine.temperature} unit="°C" icon={Thermometer} color="#f59e0b" />
                                <MetricTile label="Load" value={machine.powerConsumption} unit="kW" icon={Zap} color="#6366f1" />
                                <MetricTile label="OEE Index" value={machine.efficiency} unit="%" icon={BarChart3} color="#22c55e" />
                                <MetricTile label="Pressure" value={machine.pressure} unit="PSI" icon={Wind} color="#06b6d4" />

                                <button 
                                    className="col-span-2 mt-4 p-5 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-sky-500/10 rounded-xl"><SlidersHorizontal size={20} className="text-sky-400" /></div>
                                        <div className="text-left">
                                            <div className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Internal Diagnostic Layer</div>
                                            <div className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Sub-node telemetry & buffers</div>
                                        </div>
                                    </div>
                                    {showAdvanced ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                                </button>
                                
                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div className="col-span-2 grid grid-cols-2 gap-4" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <MetricTile label="Vibration" value={machine.vibration} unit="g" icon={Activity} color="#a855f7" />
                                            <MetricTile label="Voltage" value={machine.voltage} unit="V" icon={Zap} color="#fcd34d" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {activeTab === 'chart' && (
                            <motion.div key="chart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6">
                                <div className="h-[240px] bg-white/5 border border-white/10 rounded-[40px] p-6 relative overflow-hidden backdrop-blur-sm">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history}>
                                            <defs>
                                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="time" hide />
                                            <YAxis hide domain={['auto', 'auto']} />
                                            <Tooltip content={() => null} />
                                            <Area type="monotone" dataKey="temp" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-6 left-8 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Flow (30s Window)</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center gap-4">
                                    <Info size={24} className="text-amber-500" />
                                    <div className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed tracking-wide">Trends indicate nominal thermal stability within the current workload.</div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'ops' && (
                            <motion.div key="ops" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {COMMANDS.map(c => {
                                        const isLoading = cmdLoading[c.cmd];
                                        return (
                                            <button key={c.cmd} onClick={() => handleCommandClick(c.cmd)} disabled={isLoading}
                                                className={`flex flex-col items-center justify-center gap-3 p-8 rounded-[40px] border transition-all active:scale-95 group relative overflow-hidden`}
                                                style={{ background: `${c.color}08`, borderColor: `${c.color}20`, color: 'white' }}>
                                                <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity" />
                                                <div className="p-4 rounded-[20px] shadow-xl" style={{ background: c.color, boxShadow: `0 10px 20px ${c.color}30` }}>
                                                    {isLoading ? <RotateCcw size={24} className="animate-spin" /> : <c.icon size={24} fill={c.cmd === 'START' ? 'white' : 'none'} />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">{c.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="mt-8 p-6 bg-white/5 border border-white/5 rounded-[40px] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${forceOverride ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-500'}`}>
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[10px] font-black text-white uppercase tracking-widest">Manual Override</div>
                                            <div className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Bypass safety protocols</div>
                                        </div>
                                    </div>
                                    <div className={`w-14 h-8 rounded-full p-1 transition-colors ${forceOverride ? 'bg-rose-500' : 'bg-slate-800'}`} onClick={() => setForceOverride(!forceOverride)}>
                                        <motion.div className="w-6 h-6 bg-white rounded-full shadow-sm" animate={{ x: forceOverride ? 24 : 0 }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Cascade Warning Modal */}
            <AnimatePresence>
                {pendingCmd && (
                    <motion.div className="fixed inset-0 z-[200] flex items-center justify-center px-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setPendingCmd(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-slate-900 border border-white/10 rounded-[48px] p-10 w-full max-w-sm text-center shadow-2xl">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                                <ShieldAlert size={40} className="text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3">Cascade Warning</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed mb-8">This operation will propagate disruption to 3 downstream dependencies. Proceed with caution.</p>
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all" onClick={() => executeCommand(pendingCmd, forceOverride)}>CONFIRM BREAK</button>
                                <button className="w-full py-5 bg-white/5 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all" onClick={() => setPendingCmd(null)}>CANCEL</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileMachineDetailPage;

