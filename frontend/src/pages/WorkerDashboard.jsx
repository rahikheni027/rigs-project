import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useMachines } from '../context/MachineContext';
import ProcessFlowDiagram from '../components/ProcessFlowDiagram';
import {
    Cpu, Thermometer, Activity, Zap, Gauge, AlertTriangle, Signal, ChevronRight,
    Shield, Clock, BarChart3, Wifi, Radio, TrendingUp, Factory, Droplets,
    Fan, Cog, Server, ArrowUpRight, ArrowDownRight, Minus, Volume2
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'RUN' },
    STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.08)', label: 'STOP' },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'E-STOP' },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'MAINT' },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'CAL' },
    OFFLINE: { color: '#475569', bg: 'rgba(71,85,105,0.08)', label: 'OFF' },
};

const MACHINE_ICONS = {
    PUMP: Droplets,
    MOTOR: Cog,
    COMPRESSOR: Fan,
    TURBINE: Activity,
    GENERATOR: Zap,
};

const S = {
    card: { background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.08)', borderRadius: 10, padding: 16 },
    label: { fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#0f172a', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ color: '#64748b', marginBottom: 4, fontSize: 10 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: '#94a3b8' }}>{p.name}:</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{p.value != null ? Number(p.value).toFixed(1) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

// OEE Gauge Component
const OEEGauge = ({ value }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 85 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
    const label = value >= 85 ? 'WORLD CLASS' : value >= 60 ? 'ACCEPTABLE' : 'LOW';

    return (
        <div style={{ textAlign: 'center' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(14,165,233,0.06)" strokeWidth="6" />
                <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ marginTop: -70, position: 'relative' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace" }}>{value.toFixed(1)}%</div>
                <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>OEE</div>
                <div style={{ fontSize: 7, color, fontWeight: 700, letterSpacing: '0.05em', marginTop: 1 }}>{label}</div>
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

    // Build chart data directly from streaming machines state
    useEffect(() => {
        if (!machines || machines.length === 0) return;
        setChartData(prev => {
            const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            // Only add a new point if the time has changed (prevents 10s of points per second)
            if (prev.length > 0 && prev[prev.length - 1].time === now) return prev;

            const avgTemp = machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length;
            const avgVib = machines.reduce((s, m) => s + (m.vibration || 0), 0) / machines.length;
            const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0);
            const avgRpm = machines.reduce((s, m) => s + (m.rpm || 0), 0) / machines.length;
            const avgEff = machines.reduce((s, m) => s + (m.efficiency || 0), 0) / machines.length;
            
            const next = [...prev, { time: now, temp: avgTemp, vib: avgVib, power: totalPower, rpm: avgRpm, eff: avgEff }];
            return next.length > 40 ? next.slice(-40) : next;
        });
    }, [machines]);

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const stoppedCount = machines.filter(m => m.status === 'STOPPED' || m.status === 'OFFLINE').length;
    const alertMachines = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert);
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length) : 0;
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0);
    const avgEfficiency = machines.length ? (machines.reduce((s, m) => s + (m.efficiency || 0), 0) / machines.length) : 0;
    const avgRpm = machines.length ? (machines.reduce((s, m) => s + (m.rpm || 0), 0) / machines.length) : 0;
    const activeAlerts = alerts.filter(a => !a.acknowledged);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');
    const mediumAlerts = activeAlerts.filter(a => a.severity === 'MEDIUM');

    // OEE Calculation: Availability × Performance × Quality
    const availability = machines.length > 0 ? (runCount / machines.length) * 100 : 0;
    const performance = avgEfficiency;
    const quality = 100 - (machines.reduce((s, m) => s + (m.errorRate || 0), 0) / Math.max(machines.length, 1)) * 100;
    const oee = (availability * performance * quality) / 10000;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Signal size={22} color="#0ea5e9" style={{ animation: 'pulse 1.5s infinite' }} />
            </div>
            <p style={{ color: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>LOADING SCADA OVERVIEW...</p>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f1f5f9' }}>
            {/* Alarm Banner */}
            {criticalAlerts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8, marginBottom: 14, animation: 'alarm-flash 2s ease-in-out infinite',
                    }}
                >
                    <Volume2 size={14} color="#ef4444" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                        ⚠ {criticalAlerts.length} CRITICAL ALARM{criticalAlerts.length > 1 ? 'S' : ''} ACTIVE
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>
                        {criticalAlerts[0]?.message?.substring(0, 50)}...
                    </span>
                </motion.div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>SYSTEM OVERVIEW</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 4, padding: '3px 8px' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>R.I.G.S. INDUSTRIAL SCADA · REAL-TIME SSE STREAM</p>
                </div>
                {/* Alarm Summary */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {[
                        { label: 'CRIT', count: criticalAlerts.length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                        { label: 'WARN', count: mediumAlerts.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                        { label: 'INFO', count: Math.max(0, activeAlerts.length - criticalAlerts.length - mediumAlerts.length), color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                    ].map(a => (
                        <div key={a.label} style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                            background: a.bg, border: `1px solid ${a.color}20`, borderRadius: 4,
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.color, animation: a.count > 0 ? 'alarm-flash 1.5s infinite' : 'none' }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: a.color, fontFamily: "'JetBrains Mono', monospace" }}>{a.label}: {a.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
                {[
                    { label: 'Machines Online', value: `${runCount}/${machines.length}`, icon: Cpu, color: '#22c55e', trend: runCount >= machines.length / 2 ? 'up' : 'down' },
                    { label: 'Active Alarms', value: activeAlerts.length, icon: AlertTriangle, color: activeAlerts.length > 0 ? '#ef4444' : '#4ade80', trend: activeAlerts.length > 0 ? 'down' : 'up' },
                    { label: 'Avg Temperature', value: `${avgTemp.toFixed(1)}°C`, icon: Thermometer, color: avgTemp > 80 ? '#ef4444' : '#f59e0b', trend: avgTemp > 80 ? 'down' : 'flat' },
                    { label: 'Total Power', value: `${totalPower.toFixed(1)} kW`, icon: Zap, color: '#a855f7' },
                    { label: 'Avg Efficiency', value: `${avgEfficiency.toFixed(1)}%`, icon: BarChart3, color: '#22c55e', trend: avgEfficiency > 80 ? 'up' : 'down' },
                    { label: 'Avg RPM', value: avgRpm.toFixed(0), icon: Gauge, color: '#3b82f6' },
                ].map(kpi => {
                    const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus;
                    return (
                        <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                            ...S.card, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: `${kpi.color}10`, border: `1px solid ${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <kpi.icon size={13} color={kpi.color} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ ...S.label, marginBottom: 2 }}>{kpi.label}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</span>
                                    {kpi.trend && <TrendIcon size={11} color={kpi.trend === 'up' ? '#22c55e' : kpi.trend === 'down' ? '#ef4444' : '#64748b'} />}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* P&ID Process Flow Diagram */}
            <div style={S.card}>
                <ProcessFlowDiagram machines={machines} dependencyGraph={dependencyGraph} cascadingFailure={cascadingFailure} />
            </div>

            <div style={{ height: 12 }} />

            {/* Main Grid: Charts + OEE + Alarms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 12, marginBottom: 16 }}>
                {/* Temperature & Power Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>PROCESS TELEMETRY — LIVE</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="powerG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tempG)" strokeWidth={1.5} name="Avg Temp (°C)" dot={false} />
                            <Area type="monotone" dataKey="power" stroke="#a855f7" fill="url(#powerG)" strokeWidth={1.5} name="Total Power (kW)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Efficiency & RPM Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>PERFORMANCE METRICS</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="effG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.05)" />
                            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="eff" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <YAxis yAxisId="rpm" orientation="right" tick={{ fontSize: 8, fill: '#475569', fontFamily: "'JetBrains Mono'" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area yAxisId="eff" type="monotone" dataKey="eff" stroke="#22c55e" fill="url(#effG)" strokeWidth={1.5} name="Efficiency (%)" dot={false} />
                            <Area yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#3b82f6" fill="none" strokeWidth={1.5} name="Avg RPM" dot={false} strokeDasharray="4 2" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* OEE + Shift Info Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* OEE Gauge */}
                    <div style={{ ...S.card, textAlign: 'center' }}>
                        <div style={{ ...S.label, marginBottom: 8 }}>OVERALL EQUIPMENT EFFECTIVENESS</div>
                        <OEEGauge value={oee} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 20 }}>
                            {[
                                { label: 'AVAIL', value: availability.toFixed(0), color: '#22c55e' },
                                { label: 'PERF', value: performance.toFixed(0), color: '#3b82f6' },
                                { label: 'QUAL', value: quality.toFixed(0), color: '#a855f7' },
                            ].map(m => (
                                <div key={m.label} style={{ padding: '4px', background: 'rgba(14,165,233,0.04)', borderRadius: 4, border: '1px solid rgba(14,165,233,0.06)' }}>
                                    <div style={{ fontSize: 7, color: '#64748b', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shift Info */}
                    <div style={S.card}>
                        <div style={{ ...S.label, marginBottom: 8 }}>SHIFT INFORMATION</div>
                        {[
                            { label: 'Current Shift', value: (() => { const h = new Date().getHours(); return h >= 6 && h < 14 ? 'DAY (A)' : h >= 14 && h < 22 ? 'EVENING (B)' : 'NIGHT (C)'; })() },
                            { label: 'Shift Start', value: (() => { const h = new Date().getHours(); return h >= 6 && h < 14 ? '06:00' : h >= 14 && h < 22 ? '14:00' : '22:00'; })() },
                            { label: 'Control Mode', value: 'AUTOMATIC' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(14,165,233,0.04)' }}>
                                <span style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alarm Panel + Machine Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {/* Active Alarms */}
                <div style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={S.label}>ALARM PANEL</div>
                        {activeAlerts.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div className="alarm-indicator critical" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>{activeAlerts.length} UNRESOLVED</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                        {activeAlerts.length > 0 ? activeAlerts.map(a => {
                            const sevColors = { CRITICAL: '#ef4444', MEDIUM: '#f59e0b', LOW: '#0ea5e9' };
                            return (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                                    background: 'rgba(15,23,42,0.6)', borderRadius: 6,
                                    borderLeft: `3px solid ${sevColors[a.severity] || '#0ea5e9'}`,
                                }}>
                                    <AlertTriangle size={11} color={sevColors[a.severity] || '#0ea5e9'} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.message}</div>
                                        <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{a.machineName} · {a.severity}</div>
                                    </div>
                                    <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${sevColors[a.severity] || '#0ea5e9'}10`, color: sevColors[a.severity] || '#0ea5e9', fontFamily: "'JetBrains Mono', monospace" }}>{a.type}</span>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                <Shield size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
                                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>ALL SYSTEMS NOMINAL</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Process Overview — Machine Status Grid */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 10 }}>PROCESS UNIT OVERVIEW</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
                        {machines.map(m => {
                            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                            const MIcon = MACHINE_ICONS[m.machineType] || Cpu;
                            return (
                                <Link key={m.machineId} to={`/app/machines/${m.machineId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        background: sc.bg, border: `1px solid ${sc.color}15`,
                                        borderRadius: 6, padding: '8px 10px', transition: 'all 0.2s',
                                        cursor: 'pointer',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <MIcon size={12} color={sc.color} />
                                                <span style={{ fontSize: 11, fontWeight: 700 }}>{m.machineName}</span>
                                            </div>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, animation: m.status === 'RUNNING' ? 'pulse 2s infinite' : m.status === 'EMERGENCY' ? 'alarm-flash 0.8s infinite' : 'none' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                            <div>
                                                <div style={{ fontSize: 7, color: '#64748b', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>TEMP</div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: (m.temperature || 0) > 85 ? '#ef4444' : '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{m.temperature != null ? m.temperature.toFixed(0) : '--'}°</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 7, color: '#64748b', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>EFF</div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>{m.efficiency != null ? m.efficiency.toFixed(0) : '--'}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* System Diagnostics */}
            <div style={S.card}>
                <div style={{ ...S.label, marginBottom: 10 }}>SYSTEM DIAGNOSTICS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    {[
                        { label: 'MQTT Broker', status: 'CONNECTED', color: '#22c55e', icon: Wifi },
                        { label: 'Data Pipeline', status: 'ACTIVE · 4s', color: '#22c55e', icon: Signal },
                        { label: 'Last Update', status: new Date().toLocaleTimeString('en-US', { hour12: false }), color: '#0ea5e9', icon: Clock },
                        { label: 'Alert Engine', status: 'MONITORING', color: '#22c55e', icon: Shield },
                        { label: 'Control System', status: 'AUTOMATIC', color: '#22c55e', icon: Server },
                        { label: 'Plant Status', status: `${runCount}/${machines.length} ONLINE`, color: runCount > 0 ? '#22c55e' : '#ef4444', icon: Factory },
                    ].map(d => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(15,23,42,0.5)', borderRadius: 6, border: '1px solid rgba(14,165,233,0.04)' }}>
                            <d.icon size={12} color={d.color} />
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>{d.label}</div>
                                <div style={{ fontSize: 9, color: d.color, fontFamily: "'JetBrains Mono', monospace" }}>{d.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
