import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import api from '../api/axios';
import {
    Cpu, Thermometer, Zap, AlertTriangle, Signal, Shield, Clock,
    Wifi, BarChart3, ChevronRight
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

const Dashboard = () => {
    const [machines, setMachines] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    const fetchData = async () => {
        try {
            const [machRes, alertRes] = await Promise.all([
                api.get('/machines'),
                api.get('/alerts?size=10'),
            ]);
            setMachines(machRes.data);
            setAlerts(alertRes.data.content || []);

            setChartData(prev => {
                const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const avgTemp = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.temperature || 0), 0) / machRes.data.length : 0;
                const totalPower = machRes.data.reduce((s, m) => s + (m.powerConsumption || 0), 0);
                const avgEff = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.efficiency || 0), 0) / machRes.data.length : 0;
                const next = [...prev, { time: now, temp: avgTemp, power: totalPower, eff: avgEff }];
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
    const avgEff = machines.length ? (machines.reduce((s, m) => s + (m.efficiency || 0), 0) / machines.length).toFixed(1) : '—';
    const activeAlerts = alerts.filter(a => !a.acknowledged);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <Signal size={28} color="#38bdf8" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 13 }}>Initializing SCADA overview…</p>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>Admin Overview</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '4px 10px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>R.I.G.S. SCADA — Supervisory Control & Data Acquisition</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wifi size={14} color="#22c55e" />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>MQTT Connected</span>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
                {[
                    { label: 'Fleet Status', value: `${runCount}/${machines.length}`, sub: 'online', icon: Cpu, color: '#22c55e' },
                    { label: 'Active Alerts', value: alertCount, sub: alertCount > 0 ? 'requires attention' : 'all clear', icon: AlertTriangle, color: alertCount > 0 ? '#ef4444' : '#4ade80' },
                    { label: 'Avg Temperature', value: `${avgTemp}°C`, sub: 'fleet average', icon: Thermometer, color: '#f59e0b' },
                    { label: 'Power Draw', value: `${totalPower} kW`, sub: 'total consumption', icon: Zap, color: '#ec4899' },
                    { label: 'Fleet Efficiency', value: `${avgEff}%`, sub: 'overall OEE', icon: BarChart3, color: '#22c55e' },
                ].map(kpi => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                        background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '12px 14px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <kpi.icon size={14} color={kpi.color} />
                            </div>
                            <span style={S.label}>{kpi.label}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{kpi.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 18 }}>
                {/* Chart */}
                <div style={S.card}>
                    <div style={{ ...S.label, marginBottom: 14 }}>Fleet Telemetry — Real-Time</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="t2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="p2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#t2)" strokeWidth={2} name="Avg Temp (°C)" dot={false} />
                            <Area type="monotone" dataKey="power" stroke="#ec4899" fill="url(#p2)" strokeWidth={2} name="Total Power (kW)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Alerts panel */}
                <div style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={S.label}>Recent Alerts</div>
                        <Link to="/app/alerts" style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ChevronRight size={12} />
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                        {alerts.length > 0 ? alerts.slice(0, 8).map(a => {
                            const sevColors = { CRITICAL: '#ef4444', MEDIUM: '#f59e0b', LOW: '#38bdf8' };
                            return (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                    background: 'rgba(31,41,55,0.5)', borderRadius: 10, opacity: a.acknowledged ? 0.5 : 1,
                                    borderLeft: `3px solid ${sevColors[a.severity] || '#38bdf8'}`,
                                }}>
                                    <AlertTriangle size={13} color={sevColors[a.severity] || '#38bdf8'} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.message}</div>
                                        <div style={{ fontSize: 10, color: '#6b7280' }}>{a.machineName}</div>
                                    </div>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${sevColors[a.severity]}15`, color: sevColors[a.severity], textTransform: 'uppercase' }}>{a.severity}</span>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                                <Shield size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                                <div style={{ fontSize: 12, fontWeight: 600 }}>No recent alerts</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Machine fleet overview */}
            <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={S.label}>Machine Fleet Status</div>
                    <Link to="/app/machines" style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Control center <ChevronRight size={12} />
                    </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {machines.map(m => {
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                        return (
                            <Link key={m.machineId} to={`/app/machines/${m.machineId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(31,41,55,0.4)', borderRadius: 10, borderLeft: `3px solid ${sc.color}` }}>
                                    <Cpu size={14} color={sc.color} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.machineName}</div>
                                        <div style={{ fontSize: 10, color: '#6b7280' }}>
                                            {m.temperature != null ? `${m.temperature.toFixed(1)}°C` : '—'} · {m.powerConsumption != null ? `${m.powerConsumption.toFixed(1)}kW` : '—'}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: sc.bg, color: sc.color, textTransform: 'uppercase' }}>{m.status}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
