import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Cpu, Activity, AlertCircle, CheckCircle2, ShieldAlert, Zap, TrendingUp, RadioTower, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const S = {
    page: { color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' },
    hdr: { marginBottom: 32 },
    eyebrow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
    eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', animation: 'pulse 2s infinite' },
    eyebrowTxt: { fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' },
    h1: { fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' },
    sub: { fontSize: 14, color: '#6b7280' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 },
    statCard: {
        background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer', transition: 'all 0.25s',
    },
    iconBox: (bg) => ({ background: bg, borderRadius: 12, padding: 12, flexShrink: 0 }),
    statLabel: { fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
    statVal: { fontSize: 30, fontWeight: 900, color: '#f9fafb', lineHeight: 1.1 },
    row: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 },
    card: { background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 },
    cardTitle: { fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
    miniCard: {
        background: 'rgba(31,41,55,0.5)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 16, transition: 'all 0.25s',
    },
};

const Dashboard = () => {
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
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={24} color="#38bdf8" /></div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading system data…</p>
        </div>
    );

    const running = machines.filter(m => m.status === 'RUNNING').length;
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;
    const health = machines.length > 0 ? Math.round((running / machines.length) * 100) : 0;
    const chartData = machines.slice(0, 8).map(m => ({ name: m.name?.split(' ').slice(-1)[0] || m.name, temp: m.temperature || 0, vib: m.vibration || 0 }));

    const stats = [
        { label: 'Total Machines', value: machines.length, icon: Cpu, bg: 'rgba(14,165,233,0.1)', color: '#38bdf8' },
        { label: 'Running', value: running, icon: Activity, bg: 'rgba(34,197,94,0.1)', color: '#4ade80' },
        { label: 'Active Alerts', value: activeAlerts, icon: AlertCircle, bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
        { label: 'System Health', value: `${health}%`, icon: TrendingUp, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
    ];

    return (
        <div style={S.page}>
            <div style={S.hdr}>
                <div style={S.eyebrow}><div style={S.eyebrowDot} /><span style={S.eyebrowTxt}>Live Dashboard</span></div>
                <h1 style={S.h1}>System Overview</h1>
                <p style={S.sub}>Real-time monitoring of your industrial network</p>
            </div>

            {/* Stat cards */}
            <div style={S.grid4}>
                {stats.map((s, i) => (
                    <div key={s.label} style={S.statCard}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>
                        <div style={S.iconBox(s.bg)}><s.icon size={22} color={s.color} /></div>
                        <div>
                            <div style={S.statLabel}>{s.label}</div>
                            <div style={S.statVal}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Chart */}
                    <div style={S.card}>
                        <div style={S.cardTitle}>
                            <Activity size={18} color="#38bdf8" />
                            <span>Temperature Across Fleet</span>
                            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 999, padding: '2px 10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live</span>
                        </div>
                        <div style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f9fafb', fontSize: 13 }} />
                                    <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#0ea5e9" fill="url(#gt)" strokeWidth={2.5} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Mini machine cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        {machines.slice(0, 4).map(m => (
                            <div key={m.id} style={S.miniCard}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.2)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{m.location}</div>
                                    </div>
                                    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', ...(m.status === 'RUNNING' ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' } : { background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.15)' }) }}>{m.status}</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Temperature</span>
                                    <span style={{ color: m.temperature > 80 ? '#f87171' : '#f9fafb', fontWeight: 700 }}>{m.temperature != null ? m.temperature.toFixed(1) : '—'}°C</span>
                                </div>
                                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 999, background: m.temperature > 80 ? '#ef4444' : '#0ea5e9', width: `${Math.min(m.temperature || 0, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerts sidebar */}
                <div style={S.card}>
                    <div style={S.cardTitle}>
                        <ShieldAlert size={18} color="#f87171" />
                        <span>Priority Alerts</span>
                        {activeAlerts > 0 && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 999, padding: '2px 10px' }}>{activeAlerts} active</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {alerts.length > 0 ? alerts.slice(0, 6).map(a => (
                            <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', cursor: 'default' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: a.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', ...(a.severity === 'CRITICAL' && { animation: 'pulse 2s infinite' }) }} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</div>
                                    <div style={{ fontSize: 11, color: '#4b5563' }}>{a.machineName} · {new Date(a.createdAt).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <CheckCircle2 color="#4ade80" size={36} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontSize: 13, color: '#6b7280' }}>All systems operational</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
