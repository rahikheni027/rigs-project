import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Cpu, Activity, AlertCircle, CheckCircle2, Zap, TrendingUp,
    Thermometer, Waves, BatteryCharging, MapPin, ChevronRight,
    Clock, ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WorkerDashboard = () => {
    const { user } = useAuth();
    const [machines, setMachines] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mR, aR] = await Promise.all([api.get('/machines'), api.get('/alerts')]);
                setMachines(mR.data);
                setAlerts(aR.data.content || []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
        const t = setInterval(fetchData, 10000);
        return () => clearInterval(t);
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(34,197,94,0.2))',
                    border: '1px solid rgba(14,165,233,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <Zap size={26} color="#38bdf8" />
            </motion.div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading dashboard…</p>
        </div>
    );

    const running = machines.filter(m => m.status === 'RUNNING').length;
    const stopped = machines.filter(m => m.status === 'STOPPED').length;
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;
    const health = machines.length > 0 ? Math.round((running / machines.length) * 100) : 0;
    const chartData = machines.slice(0, 10).map(m => ({
        name: m.name?.replace(/[-_]/g, ' ').split(' ').pop() || m.name,
        temp: m.temperature || Math.round(55 + Math.random() * 30),
        vib: m.vibration || Math.round((0.5 + Math.random() * 2) * 10) / 10,
    }));

    const stats = [
        { label: 'Total Machines', value: machines.length, icon: Cpu, bg: 'linear-gradient(135deg, #0ea5e9, #0284c7)', shadow: 'rgba(14,165,233,0.3)' },
        { label: 'Running', value: running, icon: Activity, bg: 'linear-gradient(135deg, #22c55e, #16a34a)', shadow: 'rgba(34,197,94,0.3)' },
        { label: 'Stopped', value: stopped, icon: Clock, bg: 'linear-gradient(135deg, #6b7280, #4b5563)', shadow: 'rgba(107,114,128,0.3)' },
        { label: 'System Health', value: `${health}%`, icon: TrendingUp, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)' },
    ];

    return (
        <div style={{ color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Monitoring</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' }}>
                    Welcome, {user?.name?.split(' ')[0] || 'Operator'} 👋
                </h1>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Real-time overview of your industrial machines</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: 24,
                            display: 'flex', alignItems: 'center', gap: 16,
                            cursor: 'default', transition: 'all 0.25s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>
                        <div style={{
                            background: s.bg, borderRadius: 14, padding: 14,
                            boxShadow: `0 4px 20px ${s.shadow}`, flexShrink: 0,
                        }}>
                            <s.icon size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                            <div style={{ fontSize: 30, fontWeight: 900, color: '#f9fafb', lineHeight: 1.1 }}>{s.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Temperature chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: 24,
                        }}>
                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <Thermometer size={18} color="#38bdf8" />
                            <span>Temperature Overview</span>
                            <span style={{
                                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                                background: 'rgba(14,165,233,0.1)', color: '#38bdf8',
                                border: '1px solid rgba(14,165,233,0.2)',
                                borderRadius: 999, padding: '2px 10px',
                                letterSpacing: '0.06em', textTransform: 'uppercase'
                            }}>Live</span>
                        </div>
                        <div style={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f9fafb', fontSize: 13 }} />
                                    <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#0ea5e9" fill="url(#gTemp)" strokeWidth={2.5} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Machine cards grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        {machines.slice(0, 6).map((m, i) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                style={{
                                    background: 'rgba(17,24,39,0.7)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 14, padding: 18,
                                    transition: 'all 0.25s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={10} /> {m.location}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        ...(m.status === 'RUNNING'
                                            ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                                            : { background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.15)' })
                                    }}>{m.status}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    {[
                                        { label: 'Temp', value: `${m.temperature ?? '—'}°`, icon: Thermometer, color: (m.temperature || 0) > 80 ? '#f87171' : '#38bdf8' },
                                        { label: 'Vibration', value: m.vibration ?? '—', icon: Waves, color: '#a78bfa' },
                                        { label: 'Current', value: m.currentDraw ?? '—', icon: BatteryCharging, color: '#fbbf24' },
                                    ].map(metric => (
                                        <div key={metric.label} style={{
                                            background: 'rgba(31,41,55,0.5)', borderRadius: 8, padding: 8, textAlign: 'center',
                                        }}>
                                            <metric.icon size={12} color={metric.color} style={{ margin: '0 auto 4px' }} />
                                            <div style={{ fontSize: 13, fontWeight: 800, color: metric.color }}>{metric.value}</div>
                                            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>{metric.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {machines.length > 6 && (
                        <Link to="/app/machines" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '12px', borderRadius: 12,
                            background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
                            color: '#38bdf8', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                            transition: 'all 0.2s',
                        }}>
                            View All {machines.length} Machines <ChevronRight size={16} />
                        </Link>
                    )}
                </div>

                {/* Alerts sidebar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        background: 'rgba(17,24,39,0.8)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, padding: 24,
                        height: 'fit-content',
                    }}>
                    <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <ShieldAlert size={18} color="#f87171" />
                        <span>Priority Alerts</span>
                        {activeAlerts > 0 && (
                            <span style={{
                                marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 999, padding: '2px 10px'
                            }}>{activeAlerts} active</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {alerts.length > 0 ? alerts.slice(0, 8).map(a => (
                            <div key={a.id} style={{
                                display: 'flex', gap: 12, padding: '10px 12px',
                                borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                                    background: a.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                                    ...(a.severity === 'CRITICAL' && { animation: 'pulse 2s infinite' }),
                                }} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {a.message}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#4b5563' }}>
                                        {a.machineName} · {new Date(a.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <CheckCircle2 color="#4ade80" size={36} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontSize: 13, color: '#6b7280' }}>All systems operational</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
