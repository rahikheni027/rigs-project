import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import api from '../api/axios';
import {
    Cpu, Thermometer, Activity, Zap, Gauge, AlertTriangle, Signal, ChevronRight,
    Shield, Clock, BarChart3, Wifi
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    STOPPED: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    OFFLINE: { color: '#4b5563', bg: 'rgba(75,85,99,0.1)' },
};

const S = {
    card: { background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 },
    label: { fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
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
                    <span style={{ color: '#f9fafb', fontWeight: 700 }}>{p.value != null ? Number(p.value).toFixed(1) : '—'}</span>
                </div>
            ))}
        </div>
    );
};

const WorkerDashboard = () => {
    const [machines, setMachines] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    const fetchData = async () => {
        try {
            const [machRes, alertRes] = await Promise.all([
                api.get('/machines'),
                api.get('/alerts?size=8'),
            ]);
            setMachines(machRes.data);
            setAlerts(alertRes.data.content || []);

            // Build chart data point from current state
            setChartData(prev => {
                const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const avgTemp = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.temperature || 0), 0) / machRes.data.length : 0;
                const avgVib = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.vibration || 0), 0) / machRes.data.length : 0;
                const totalPower = machRes.data.reduce((s, m) => s + (m.powerConsumption || 0), 0);
                const avgRpm = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.rpm || 0), 0) / machRes.data.length : 0;
                const next = [...prev, { time: now, temp: avgTemp, vib: avgVib, power: totalPower, rpm: avgRpm }];
                return next.length > 30 ? next.slice(-30) : next;
            });
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 4000);
        return () => clearInterval(t);
    }, []);

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length).toFixed(1) : '—';
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0).toFixed(1);
    const avgEfficiency = machines.length ? (machines.reduce((s, m) => s + (m.efficiency || 0), 0) / machines.length).toFixed(1) : '—';
    const activeAlerts = alerts.filter(a => !a.acknowledged);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <Signal size={28} color="#38bdf8" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 13 }}>Initializing SCADA overview…</p>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>System Overview</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '4px 10px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>R.I.G.S. Industrial Monitoring Dashboard</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wifi size={14} color="#22c55e" />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>MQTT Connected · Polling 4s</span>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
                {[
                    { label: 'Machines Online', value: `${runCount}/${machines.length}`, icon: Cpu, color: '#22c55e' },
                    { label: 'Active Alerts', value: alertCount, icon: AlertTriangle, color: alertCount > 0 ? '#ef4444' : '#4ade80' },
                    { label: 'Avg Temperature', value: `${avgTemp}°C`, icon: Thermometer, color: '#f59e0b' },
                    { label: 'Total Power', value: `${totalPower} kW`, icon: Zap, color: '#ec4899' },
                    { label: 'Avg Efficiency', value: `${avgEfficiency}%`, icon: BarChart3, color: '#22c55e' },
                    { label: 'System Uptime', value: '99.7%', icon: Shield, color: '#3b82f6' },
                ].map(kpi => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                        background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <kpi.icon size={15} color={kpi.color} />
                        </div>
                        <div>
                            <div style={S.label}>{kpi.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{kpi.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 18 }}>
                {/* Live Telemetry Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 14 }}>Fleet Telemetry — Live Feed</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="powerG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tempG)" strokeWidth={2} name="Avg Temp (°C)" dot={false} />
                            <Area type="monotone" dataKey="power" stroke="#ec4899" fill="url(#powerG)" strokeWidth={2} name="Total Power (kW)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Alarm Panel */}
                <div style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={S.label}>Active Alarms</div>
                        {activeAlerts.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>{activeAlerts.length} unresolved</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                        {activeAlerts.length > 0 ? activeAlerts.map(a => {
                            const sevColors = { CRITICAL: '#ef4444', MEDIUM: '#f59e0b', LOW: '#38bdf8' };
                            return (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                    background: 'rgba(31,41,55,0.5)', borderRadius: 10,
                                    borderLeft: `3px solid ${sevColors[a.severity] || '#38bdf8'}`,
                                }}>
                                    <AlertTriangle size={13} color={sevColors[a.severity] || '#38bdf8'} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.message}</div>
                                        <div style={{ fontSize: 10, color: '#6b7280' }}>{a.machineName} · {a.severity}</div>
                                    </div>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${sevColors[a.severity] || '#38bdf8'}15`, color: sevColors[a.severity] || '#38bdf8', textTransform: 'uppercase' }}>{a.type}</span>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                                <Shield size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                                <div style={{ fontSize: 12, fontWeight: 600 }}>All systems nominal</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Machine Health Grid */}
            <div style={{ marginBottom: 18 }}>
                <div style={{ ...S.label, marginBottom: 12 }}>Machine Health Overview</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {machines.map(m => {
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                        return (
                            <Link key={m.machineId} to={`/app/machines/${m.machineId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <motion.div whileHover={{ scale: 1.01 }} style={{
                                    background: 'rgba(17,24,39,0.85)', border: `1px solid ${sc.color}25`,
                                    borderRadius: 14, padding: '12px 16px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Cpu size={13} color={sc.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.machineName}</div>
                                                <div style={{ fontSize: 10, color: '#6b7280' }}>{m.location}</div>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                                            background: sc.bg, color: sc.color, textTransform: 'uppercase',
                                        }}>{m.status}</span>
                                    </div>
                                    {/* Mini metric row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                                        {[
                                            { label: 'Temp', value: m.temperature, unit: '°', color: '#f59e0b' },
                                            { label: 'RPM', value: m.rpm, unit: '', color: '#3b82f6' },
                                            { label: 'Power', value: m.powerConsumption, unit: 'kW', color: '#ec4899' },
                                            { label: 'Eff', value: m.efficiency, unit: '%', color: '#22c55e' },
                                        ].map(metric => (
                                            <div key={metric.label} style={{ textAlign: 'center', padding: '6px 4px', background: 'rgba(31,41,55,0.5)', borderRadius: 8 }}>
                                                <div style={{ fontSize: 8, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{metric.label}</div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: metric.color, fontVariantNumeric: 'tabular-nums' }}>
                                                    {metric.value != null ? metric.value.toFixed(metric.label === 'RPM' ? 0 : 1) : '—'}
                                                    <span style={{ fontSize: 8, fontWeight: 400, color: '#6b7280' }}>{metric.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* System Diagnostics */}
            <div style={S.card}>
                <div style={{ ...S.label, marginBottom: 12 }}>System Diagnostics</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    {[
                        { label: 'MQTT Broker', status: 'Connected', color: '#22c55e', icon: Wifi },
                        { label: 'Data Pipeline', status: 'Active · 4s interval', color: '#22c55e', icon: Signal },
                        { label: 'Last Data Update', status: new Date().toLocaleTimeString(), color: '#38bdf8', icon: Clock },
                        { label: 'Alert Engine', status: 'Monitoring', color: '#22c55e', icon: Shield },
                    ].map(d => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(31,41,55,0.4)', borderRadius: 10 }}>
                            <d.icon size={14} color={d.color} />
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#f9fafb' }}>{d.label}</div>
                                <div style={{ fontSize: 10, color: d.color }}>{d.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
