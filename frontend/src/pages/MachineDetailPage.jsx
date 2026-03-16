import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Cpu, Thermometer, Activity, Zap, Gauge, Wind, BarChart3,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal, AlertTriangle, Clock
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', label: 'RUNNING' },
    STOPPED: { color: '#6b7280', label: 'STOPPED' },
    EMERGENCY: { color: '#ef4444', label: 'EMERGENCY' },
    MAINTENANCE: { color: '#f59e0b', label: 'MAINTENANCE' },
    CALIBRATING: { color: '#3b82f6', label: 'CALIBRATING' },
    OFFLINE: { color: '#4b5563', label: 'OFFLINE' },
};

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'Start Machine', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { cmd: 'STOP', icon: Square, label: 'Stop Machine', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'Emergency Stop', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    { cmd: 'RESET', icon: RotateCcw, label: 'Reset', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'Maintenance Mode', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, label: 'Calibration', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
];

const S = {
    card: { background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 },
    label: { fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
    bigVal: { fontSize: 28, fontWeight: 900, fontVariantNumeric: 'tabular-nums' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ color: '#6b7280', marginBottom: 6 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: '#9ca3af' }}>{p.name}:</span>
                    <span style={{ color: '#f9fafb', fontWeight: 700 }}>{p.value != null ? p.value.toFixed(1) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

const MachineDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [machine, setMachine] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cmdLoading, setCmdLoading] = useState({});

    const fetchData = async () => {
        try {
            const [machRes, histRes] = await Promise.all([
                api.get(`/machines/${id}`),
                api.get(`/machines/${id}/history`),
            ]);
            setMachine(machRes.data);
            // Reverse so oldest is first for charts
            setHistory(histRes.data.reverse().map((d, i) => ({
                ...d,
                time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `T-${histRes.data.length - i}`,
            })));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 4000);
        return () => clearInterval(t);
    }, [id]);

    const handleCommand = async (cmd) => {
        setCmdLoading(p => ({ ...p, [cmd]: true }));
        try {
            await api.post(`/machines/${id}/command?command=${cmd}&issuedBy=${user?.name || 'operator'}`);
            setTimeout(fetchData, 800);
        } catch (e) { console.error(e); }
        finally { setTimeout(() => setCmdLoading(p => ({ ...p, [cmd]: false })), 1200); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <Cpu size={28} color="#38bdf8" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 13 }}>Loading machine analytics…</p>
        </div>
    );

    if (!machine) return (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <p>Machine not found</p>
            <Link to="/app/machines" style={{ color: '#38bdf8' }}>← Back to machines</Link>
        </div>
    );

    const sc = STATUS_CONFIG[machine.status] || STATUS_CONFIG.OFFLINE;

    const metrics = [
        { label: 'Temperature', value: machine.temperature, unit: '°C', color: '#f59e0b', icon: Thermometer },
        { label: 'RPM', value: machine.rpm, unit: '', color: '#3b82f6', icon: Gauge },
        { label: 'Vibration', value: machine.vibration, unit: ' g', color: '#8b5cf6', icon: Activity },
        { label: 'Pressure', value: machine.pressure, unit: ' PSI', color: '#06b6d4', icon: Wind },
        { label: 'Power', value: machine.powerConsumption, unit: ' kW', color: '#ec4899', icon: Zap },
        { label: 'Efficiency', value: machine.efficiency, unit: '%', color: '#22c55e', icon: BarChart3 },
    ];

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb' }}>
            {/* Back & Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Link to="/app/machines" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Back
                </Link>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: `${sc.color}15`, border: `1px solid ${sc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cpu size={18} color={sc.color} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>{machine.machineName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{machine.location} · Machine #{id}</div>
                    </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30`, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 'auto' }}>
                    {sc.label}
                </span>
            </div>

            {/* Current Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
                {metrics.map(m => (
                    <div key={m.label} style={{ ...S.card, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <m.icon size={13} color={m.color} />
                            <span style={S.label}>{m.label}</span>
                        </div>
                        <div style={{ ...S.bigVal, color: m.color }}>
                            {m.value != null ? m.value.toFixed(1) : '—'}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginLeft: 3 }}>{m.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 14, marginBottom: 20 }}>
                {/* Temperature & RPM Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 14 }}>Temperature & RPM Trend</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="temp" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="rpm" orientation="right" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area yAxisId="temp" type="monotone" dataKey="temperature" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} name="Temp (°C)" dot={false} />
                            <Area yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#3b82f6" fill="url(#rpmGrad)" strokeWidth={2} name="RPM" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Vibration & Pressure Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 14 }}>Vibration & Pressure Trend</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="vib" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="press" orientation="right" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line yAxisId="vib" type="monotone" dataKey="vibration" stroke="#8b5cf6" strokeWidth={2} name="Vibration (g)" dot={false} />
                            <Line yAxisId="press" type="monotone" dataKey="pressure" stroke="#06b6d4" strokeWidth={2} name="Pressure (PSI)" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Power & Efficiency Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 14 }}>Power Consumption & Efficiency</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="power" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="eff" orientation="right" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area yAxisId="power" type="monotone" dataKey="powerConsumption" stroke="#ec4899" fill="url(#powerGrad)" strokeWidth={2} name="Power (kW)" dot={false} />
                            <Line yAxisId="eff" type="monotone" dataKey="efficiency" stroke="#22c55e" strokeWidth={2} name="Efficiency (%)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Error Rate Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 14 }}>Error Rate History</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="errorRate" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} name="Error Rate" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Command Panel */}
            <div style={S.card}>
                <div style={{ ...S.label, marginBottom: 14 }}>Machine Control Panel</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                    {COMMANDS.map(c => {
                        const isActive = cmdLoading[c.cmd];
                        return (
                            <button key={c.cmd} onClick={() => handleCommand(c.cmd)} disabled={isActive}
                                style={{
                                    padding: '12px 10px', borderRadius: 12, border: `1px solid ${c.color}30`,
                                    background: isActive ? c.bg : 'transparent', color: c.color, cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8, transition: 'all 0.15s', opacity: isActive ? 0.6 : 1,
                                }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = c.bg; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}
                            >
                                <c.icon size={15} />
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MachineDetailPage;
