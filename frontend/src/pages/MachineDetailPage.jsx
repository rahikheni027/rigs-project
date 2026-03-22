import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import api from '../api/axios';
import {
    ArrowLeft, Thermometer, Activity, Zap, Gauge, Wind, BarChart3, AlertTriangle,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal, Cpu,
    Clock, TrendingUp, Download, Droplets, Fan, Cog, Radio
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.06)', label: 'RUNNING' },
    STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.06)', label: 'STOPPED' },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'EMERGENCY' },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', label: 'MAINTENANCE' },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', label: 'CALIBRATING' },
    OFFLINE: { color: '#475569', bg: 'rgba(71,85,105,0.06)', label: 'OFFLINE' },
};

const MACHINE_ICONS = { PUMP: Droplets, MOTOR: Cog, COMPRESSOR: Fan, TURBINE: Activity, GENERATOR: Zap };

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'START', color: '#22c55e' },
    { cmd: 'STOP', icon: Square, label: 'STOP', color: '#64748b' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'E-STOP', color: '#ef4444' },
    { cmd: 'RESET', icon: RotateCcw, label: 'RESET', color: '#8b5cf6' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'MAINT', color: '#f59e0b' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, label: 'CAL', color: '#3b82f6' },
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

const S = {
    card: { background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.08)', borderRadius: 10, padding: 16 },
    label: { fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#0f172a', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
            <div style={{ color: '#64748b', marginBottom: 4, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: '#94a3b8', fontSize: 10 }}>{p.name}:</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p.value != null ? Number(p.value).toFixed(2) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

const MetricCard = ({ label, value, unit, icon: Icon, color, setpoint }) => {
    const isOverLimit = setpoint && value != null && value > setpoint.max;
    const displayColor = isOverLimit ? '#ef4444' : color;

    return (
        <div style={{
            background: 'rgba(15,23,42,0.7)', border: `1px solid ${displayColor}12`, borderRadius: 8, padding: '10px 12px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={12} color={displayColor} />
                    <span style={{ ...S.label, marginBottom: 0 }}>{label}</span>
                </div>
                {isOverLimit && <AlertTriangle size={10} color="#ef4444" style={{ animation: 'alarm-flash 1s infinite' }} />}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: displayColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                {value != null ? (typeof value === 'number' ? value.toFixed(label === 'RPM' ? 0 : 2) : value) : '--'}
                <span style={{ fontSize: 10, fontWeight: 400, color: '#64748b', marginLeft: 2 }}>{unit}</span>
            </div>
            {setpoint && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>SP: {setpoint.min}–{setpoint.max}{unit}</span>
                    {value != null && (
                        <span style={{ color: isOverLimit ? '#ef4444' : '#22c55e' }}>{isOverLimit ? '▲ HIGH' : '✓ NORM'}</span>
                    )}
                </div>
            )}
        </div>
    );
};

const VirtualMachineVisualizer = ({ status, type }) => {
    const isRunning = status === 'RUNNING';
    const isError = status === 'EMERGENCY';
    const color = isError ? '#ef4444' : isRunning ? '#22c55e' : '#64748b';
    const ringColor = isError ? 'rgba(239,68,68,0.2)' : isRunning ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.1)';

    return (
        <div style={{
            background: 'rgba(15,23,42,0.6)', border: `1px solid ${color}40`,
            borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', height: 180, position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background glow */}
            <motion.div
                animate={{ opacity: isRunning ? [0.3, 0.6, 0.3] : isError ? [0.4, 0.8, 0.4] : 0.1 }}
                transition={{ duration: isError ? 0.5 : 2, repeat: Infinity }}
                style={{ position: 'absolute', width: 150, height: 150, background: color, filter: 'blur(60px)', borderRadius: '50%' }}
            />

            {/* Spinning Element */}
            <motion.div
                animate={{ rotate: isRunning ? 360 : 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                    width: 70, height: 70, border: `3px dashed ${color}`, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                    background: 'rgba(15,23,42,0.8)', boxShadow: `0 0 20px ${ringColor}`
                }}
            >
                <Cog size={28} color={color} />
            </motion.div>

            <div style={{ marginTop: 16, zIndex: 1, color: '#f8fafc', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
                {type || 'MACHINE'}
            </div>
            <motion.div
                animate={isError ? { opacity: [1, 0, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ zIndex: 1, color, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}
            >
                {status}
            </motion.div>
        </div>
    );
};

const MachineDetailPage = () => {
    const { machineId } = useParams();
    const [machine, setMachine] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cmdLoading, setCmdLoading] = useState({});

    const fetchData = async () => {
        try {
            const [machRes, histRes] = await Promise.all([
                api.get(`/machines/${machineId}/telemetry`),
                api.get(`/machines/${machineId}/telemetry/history`),
            ]);
            setMachine(machRes.data);
            const histData = (histRes.data || []).slice(-40).map((d, i) => ({
                time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : `T${i}`,
                temp: d.temperature, vib: d.vibration, rpm: d.rpm,
                pres: d.pressure, power: d.powerConsumption, eff: d.efficiency,
                cur: d.currentDraw, err: d.errorRate,
            }));
            setHistory(histData);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 10000);
        return () => clearInterval(t);
    }, [machineId]);

    const handleCommand = async (cmd) => {
        setCmdLoading(p => ({ ...p, [cmd]: true }));
        try {
            await api.post(`/machines/${machineId}/command?command=${cmd}&issuedBy=operator`);
            setTimeout(fetchData, 800);
        } catch (e) { console.error(e); }
        finally { setTimeout(() => setCmdLoading(p => ({ ...p, [cmd]: false })), 1200); }
    };

    const exportCSV = () => {
        const headers = ['Time', 'Temp', 'RPM', 'Vibration', 'Pressure', 'Power', 'Efficiency', 'Current', 'ErrorRate'];
        const rows = history.map(d => [d.time, d.temp?.toFixed(1), d.rpm?.toFixed(0), d.vib?.toFixed(2), d.pres?.toFixed(1), d.power?.toFixed(2), d.eff?.toFixed(1), d.cur?.toFixed(1), d.err?.toFixed(3)]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `rigs_machine_${machineId}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading || !machine) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <Gauge size={28} color="#0ea5e9" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>LOADING MACHINE TELEMETRY...</p>
        </div>
    );

    const sc = STATUS_CONFIG[machine.status] || STATUS_CONFIG.OFFLINE;
    const MIcon = MACHINE_ICONS[machine.machineType] || Cpu;
    const timeSinceUpdate = machine.lastHeartbeat ? Math.round((Date.now() - new Date(machine.lastHeartbeat).getTime()) / 1000) : null;

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f1f5f9' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/app/machines" style={{ color: '#64748b', display: 'flex', padding: 6, borderRadius: 6, border: '1px solid rgba(14,165,233,0.1)', background: 'rgba(14,165,233,0.04)' }}>
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <MIcon size={16} color={sc.color} />
                            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{machine.machineName}</h1>
                            <span style={{
                                fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 3,
                                background: sc.bg, color: sc.color, fontFamily: "'JetBrains Mono', monospace",
                            }}>
                                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: sc.color, marginRight: 4, animation: machine.status === 'EMERGENCY' ? 'alarm-flash 0.8s infinite' : machine.status === 'RUNNING' ? 'pulse 2s infinite' : 'none' }} />
                                {sc.label}
                            </span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                            {machine.location} · {machine.machineType || 'MOTOR'} · {machine.processUnit || 'Unit A'} · RUNTIME: {(machine.cumulativeRuntimeHours || 0).toFixed(1)}h
                            {timeSinceUpdate !== null && (
                                <span style={{ marginLeft: 8, color: timeSinceUpdate > 30 ? '#ef4444' : '#22c55e' }}>
                                    · LAST UPDATE: {timeSinceUpdate}s AGO
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={exportCSV} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                        background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                        borderRadius: 6, color: '#38bdf8', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        <Download size={11} /> EXPORT
                    </button>
                </div>
            </div>

            {/* Virtual Machine + Command Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
                <VirtualMachineVisualizer status={machine.status} type={machine.machineType} />

                <div style={{ ...S.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ ...S.label, marginBottom: 16 }}>CONTROL PANEL</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {COMMANDS.map(c => {
                            const isActive = cmdLoading[c.cmd];
                            return (
                                <button key={c.cmd} onClick={() => handleCommand(c.cmd)} disabled={isActive}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                                        borderRadius: 8, border: `1px solid ${c.color}30`, cursor: 'pointer',
                                        background: isActive ? `${c.color}15` : 'rgba(15,23,42,0.9)',
                                        color: c.color, fontSize: 12, fontWeight: 700,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        transition: 'all 0.15s', opacity: isActive ? 0.6 : 1,
                                    }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${c.color}10`; e.currentTarget.style.borderColor = `${c.color}50`; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(15,23,42,0.9)'; e.currentTarget.style.borderColor = `${c.color}30`; } }}
                                >
                                    <c.icon size={14} />
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 16 }}>
                <MetricCard label="TEMPERATURE" value={machine.temperature} unit="°C" icon={Thermometer} color="#f59e0b" setpoint={SETPOINTS.temperature} />
                <MetricCard label="RPM" value={machine.rpm} unit="" icon={Gauge} color="#3b82f6" setpoint={SETPOINTS.rpm} />
                <MetricCard label="VIBRATION" value={machine.vibration} unit="g" icon={Activity} color="#8b5cf6" setpoint={SETPOINTS.vibration} />
                <MetricCard label="PRESSURE" value={machine.pressure} unit="PSI" icon={Wind} color="#06b6d4" setpoint={SETPOINTS.pressure} />
                <MetricCard label="POWER" value={machine.powerConsumption} unit="kW" icon={Zap} color="#a855f7" setpoint={SETPOINTS.powerConsumption} />
                <MetricCard label="EFFICIENCY" value={machine.efficiency} unit="%" icon={BarChart3} color="#22c55e" setpoint={SETPOINTS.efficiency} />
                <MetricCard label="CURRENT" value={machine.currentDraw} unit="A" icon={Radio} color="#ec4899" setpoint={SETPOINTS.currentDraw} />
                <MetricCard label="ERROR RATE" value={machine.errorRate} unit="" icon={AlertTriangle} color="#ef4444" setpoint={SETPOINTS.errorRate} />
            </div>

            {/* Historical Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {/* Temperature + Vibration */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>TEMPERATURE & VIBRATION TREND</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="temp" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tG)" strokeWidth={1.5} name="Temp (°C)" dot={false} />
                            <Line yAxisId="vib" type="monotone" dataKey="vib" stroke="#8b5cf6" strokeWidth={1.5} name="Vibration (g)" dot={false} strokeDasharray="4 2" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* RPM + Power */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>RPM & POWER CONSUMPTION</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="rpmG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="rpm" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="power" orientation="right" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#3b82f6" fill="url(#rpmG)" strokeWidth={1.5} name="RPM" dot={false} />
                            <Line yAxisId="power" type="monotone" dataKey="power" stroke="#a855f7" strokeWidth={1.5} name="Power (kW)" dot={false} strokeDasharray="4 2" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Efficiency + Pressure + Current Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>EFFICIENCY TREND</div>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="eG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 7, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="eff" stroke="#22c55e" fill="url(#eG)" strokeWidth={1.5} name="Efficiency (%)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>PRESSURE TREND</div>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="pG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 7, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="pres" stroke="#06b6d4" fill="url(#pG)" strokeWidth={1.5} name="Pressure (PSI)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>CURRENT DRAW TREND</div>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 7, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="cur" stroke="#ec4899" fill="url(#cG)" strokeWidth={1.5} name="Current (A)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MachineDetailPage;
