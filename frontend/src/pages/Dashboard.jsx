import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import {
    Cpu, Thermometer, Zap, AlertTriangle, Signal, Shield, Clock,
    Wifi, BarChart3, ChevronRight, Activity, ZapOff
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'RUNNING' },
    STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', label: 'STOPPED' },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'FAULT/E-STOP' },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'MAINTENANCE' },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', label: 'CALIBRATING' },
    OFFLINE: { color: '#4b5563', bg: 'rgba(75,85,99,0.1)', border: 'rgba(75,85,99,0.3)', label: 'OFFLINE' },
};

const S = {
    card: { 
        background: 'rgba(17,24,39,0.7)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', 
        borderRadius: 20, 
        padding: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column'
    },
    label: { fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 13, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ color: '#9ca3af', marginBottom: 8, fontSize: 11, fontWeight: 600 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: '#d1d5db' }}>{p.name}:</span>
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

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const [machRes, alertRes] = await Promise.all([
                    api.get('/machines', { signal: controller.signal }),
                    api.get('/alerts?size=10', { signal: controller.signal }),
                ]);
                if (!isMounted) return;
                
                setMachines(machRes.data);
                setAlerts(alertRes.data.content || []);

                setChartData(prev => {
                    const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    if (prev.length > 0 && prev[prev.length - 1].time === now) return prev;
                    
                    const runningMachs = machRes.data.filter(m => m.status === 'RUNNING');
                    const avgTemp = machRes.data.length ? machRes.data.reduce((s, m) => s + (m.temperature || 0), 0) / machRes.data.length : 0;
                    const totalPower = machRes.data.reduce((s, m) => s + (m.powerConsumption || 0), 0);
                    const avgEff = runningMachs.length ? runningMachs.reduce((s, m) => s + (m.efficiency || 0), 0) / runningMachs.length : 0;
                    
                    const next = [...prev, { time: now, temp: avgTemp, power: totalPower, eff: avgEff }];
                    return next.length > 30 ? next.slice(-30) : next;
                });
            } catch (e) { 
                if (!isMounted || e.name === 'CanceledError') return;
                console.error(e); 
            } finally { 
                if (isMounted) setLoading(false); 
            }
        };

        fetchData();
        const t = setInterval(fetchData, 10000);
        
        return () => {
            isMounted = false;
            clearInterval(t);
            controller.abort();
        };
    }, []);

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length).toFixed(1) : '—';
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0).toFixed(1);
    
    // Efficiency based ONLY on running machines
    const runningMachines = machines.filter(m => m.status === 'RUNNING');
    const avgEff = runningMachines.length ? (runningMachines.reduce((s, m) => s + (m.efficiency || 0), 0) / runningMachines.length).toFixed(1) : '—';

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={32} color="#38bdf8" style={{ animation: 'pulse 1.5s infinite' }} />
            </div>
            <p style={{ color: '#9ca3af', fontSize: 14, fontWeight: 500, letterSpacing: '0.05em' }}>Loading Plant Overview...</p>
        </div>
    );

    return (
        <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#f9fafb', paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>Admin Overview</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '4px 12px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', letterSpacing: '0.05em' }}>LIVE SYNC</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 14, color: '#9ca3af', margin: 0, fontWeight: 400 }}>R.I.G.S. SCADA — Supervisory Control & Data Acquisition</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,24,39,0.5)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Wifi size={16} color="#34d399" />
                    <span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>MQTT Connected</span>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Fleet Status', value: `${runCount}/${machines.length}`, sub: 'Active Machines', icon: Cpu, color: '#34d399' },
                    { label: 'Active Alerts', value: alertCount, sub: alertCount > 0 ? 'Requires Action' : 'All Clear', icon: AlertTriangle, color: alertCount > 0 ? '#f87171' : '#34d399' },
                    { label: 'Avg Fleet Temp', value: `${avgTemp}°C`, sub: 'Overall Temperature', icon: Thermometer, color: '#fbbf24' },
                    { label: 'Power Draw', value: `${totalPower} kW`, sub: 'Total Consumption', icon: Zap, color: '#a78bfa' },
                    { label: 'OEE Performance', value: `${avgEff}%`, sub: 'Running Machines Avg', icon: BarChart3, color: '#38bdf8' },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{
                        background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', flex: '1 1 200px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={S.label}>{kpi.label}</span>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <kpi.icon size={18} color={kpi.color} />
                            </div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 4 }}>{kpi.value}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{kpi.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                {/* Chart Section */}
                <div style={{ ...S.card, flex: '2 1 500px', minHeight: 340 }}>
                    <div style={{ ...S.label, marginBottom: 24, fontSize: 12 }}>Fleet Telemetry Trends</div>
                    <div style={{ flex: 1, minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="pColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="temp" stroke="#fbbf24" fill="url(#tColor)" strokeWidth={3} name="Avg Temp (°C)" dot={false} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#111827', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="power" stroke="#a78bfa" fill="url(#pColor)" strokeWidth={3} name="Total Power (kW)" dot={false} activeDot={{ r: 6, fill: '#a78bfa', stroke: '#111827', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts Section */}
                <div style={{ ...S.card, flex: '1 1 320px', minHeight: 340 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ ...S.label, fontSize: 12 }}>System Alerts</div>
                        <Link to="/app/alerts" style={{ fontSize: 12, color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = 0.8} onMouseLeave={e => e.target.style.opacity = 1}>
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', paddingRight: 4 }}>
                        <AnimatePresence>
                            {alerts.length > 0 ? alerts.slice(0, 6).map((a, i) => {
                                const sevColors = { CRITICAL: '#ef4444', MEDIUM: '#f59e0b', LOW: '#38bdf8' };
                                const color = sevColors[a.severity] || '#38bdf8';
                                return (
                                    <motion.div key={a.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px',
                                        background: 'rgba(31,41,55,0.4)', borderRadius: 12, border: `1px solid ${color}30`,
                                        borderLeft: `4px solid ${color}`, opacity: a.acknowledged ? 0.6 : 1,
                                    }}>
                                        <div style={{ marginTop: 2 }}>
                                            <AlertTriangle size={16} color={color} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f4f6', marginBottom: 4, lineHeight: 1.4 }}>{a.message}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{a.machineName}</div>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${color}15`, color: color }}>{a.severity}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Shield size={36} style={{ marginBottom: 16, opacity: 0.3 }} />
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>No Active Alerts</div>
                                    <div style={{ fontSize: 12, marginTop: 4 }}>All systems operating normally</div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Machine fleet overview */}
            <div style={{ ...S.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ ...S.label, fontSize: 12 }}>Process Unit Status</div>
                    <Link to="/app/machines" style={{ padding: '8px 16px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, fontSize: 12, color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = 'rgba(56,189,248,0.15)'} onMouseLeave={e => e.target.style.background = 'rgba(56,189,248,0.1)'}>
                        Control Center <ChevronRight size={14} />
                    </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {machines.map((m, i) => {
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                        return (
                            <Link key={m.machineId} to={`/app/machines/${m.machineId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} style={{ 
                                    display: 'flex', flexDirection: 'column', padding: '16px', background: 'rgba(31,41,55,0.5)', 
                                    borderRadius: 16, border: `1px solid ${sc.border}`, transition: 'all 0.2s', cursor: 'pointer',
                                    position: 'relative', overflow: 'hidden'
                                }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${sc.color}20`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${sc.color}, transparent)` }} />
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {m.status === 'OFFLINE' || m.status === 'STOPPED' ? <ZapOff size={18} color={sc.color} /> : <Cpu size={18} color={sc.color} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f4f6', marginBottom: 2 }}>{m.machineName}</div>
                                                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{m.location || 'Unknown'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, marginBottom: 12 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>TEMP</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: m.temperature > 80 ? '#fbbf24' : '#e5e7eb' }}>{m.temperature != null ? `${m.temperature.toFixed(1)}°C` : '—'}</span>
                                        </div>
                                        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>POWER</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{m.powerConsumption != null ? `${m.powerConsumption.toFixed(1)}kW` : '—'}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: sc.bg, color: sc.color, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {m.status === 'RUNNING' && <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />}
                                            {m.status === 'EMERGENCY' && <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />}
                                            {sc.label}
                                        </span>
                                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{m.machineType}</div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
