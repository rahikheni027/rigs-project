import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Cpu, MapPin, Thermometer, Activity, Play, Square, Settings, Zap } from 'lucide-react';

const MachinesPage = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetch = async () => {
            try {
                const r = await api.get('/machines');
                setMachines(r.data);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
        const t = setInterval(fetch, 10000);
        return () => clearInterval(t);
    }, []);

    const handleCommand = async (id, cmd) => {
        try { await api.post(`/machines/${id}/command?command=${cmd}`); }
        catch { alert('Failed to send command'); }
    };

    const filtered = filter === 'all' ? machines : machines.filter(m => m.status === filter.toUpperCase());

    const st = {
        page: { fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb' },
        hdr: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 },
        h1: { fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 },
        sub: { fontSize: 14, color: '#6b7280' },
        tabs: { display: 'flex', background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, gap: 4 },
        tab: (active) => ({
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: 'none', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.2s',
            ...(active
                ? { background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', boxShadow: '0 2px 10px rgba(14,165,233,0.35)' }
                : { background: 'transparent', color: '#6b7280' })
        }),
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
        card: {
            background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, padding: 24, transition: 'all 0.25s',
        },
        row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
        machineIcon: (running) => ({
            width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: running ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
            color: running ? '#4ade80' : '#6b7280', flexShrink: 0,
        }),
        name: { fontSize: 14, fontWeight: 700, lineHeight: 1.3 },
        loc: { fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 },
        badge: (running) => ({
            fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            ...(running ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' } : { background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.2)' })
        }),
        metrics: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 },
        metric: { background: 'rgba(31,41,55,0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 },
        metricLbl: { fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 },
        metricVal: (hot) => ({ fontSize: 20, fontWeight: 900, color: hot ? '#f87171' : '#f9fafb' }),
        track: { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginTop: 8 },
        bar: (hot, pct) => ({ height: '100%', borderRadius: 999, background: hot ? '#ef4444' : '#0ea5e9', width: `${pct}%`, transition: 'width 0.5s ease' }),
        actions: { display: 'flex', gap: 8 },
        stopBtn: { flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', transition: 'all 0.2s' },
        startBtn: { flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)', color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', transition: 'all 0.2s' },
        settingBtn: { padding: 9, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: '#6b7280', cursor: 'pointer', display: 'flex', fontFamily: 'inherit', transition: 'all 0.2s' },
        hb: { fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 12 },
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cpu size={24} color="#38bdf8" /></div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading fleet data…</p>
        </div>
    );

    return (
        <div style={st.page}>
            <div style={st.hdr}>
                <div>
                    <h1 style={st.h1}>Machine Fleet</h1>
                    <p style={st.sub}>{machines.length} machines · {machines.filter(m => m.status === 'RUNNING').length} running</p>
                </div>
                <div style={st.tabs}>
                    {['all', 'running', 'offline'].map(f => (
                        <button key={f} style={st.tab(filter === f)} onClick={() => setFilter(f)}>{f}</button>
                    ))}
                </div>
            </div>

            <div style={st.grid}>
                {filtered.map(m => {
                    const running = m.status === 'RUNNING';
                    const hot = m.temperature > 80;
                    return (
                        <div key={m.id} style={st.card}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.22)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>

                            <div style={st.row}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={st.machineIcon(running)}><Cpu size={22} /></div>
                                    <div>
                                        <div style={st.name}>{m.name}</div>
                                        <div style={st.loc}><MapPin size={10} />{m.location}</div>
                                    </div>
                                </div>
                                <span style={st.badge(running)}>{m.status}</span>
                            </div>

                            <div style={st.metrics}>
                                <div style={st.metric}>
                                    <div style={st.metricLbl}><Thermometer size={10} />Temp</div>
                                    <div style={st.metricVal(hot)}>{m.temperature ?? '—'}<span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>°C</span></div>
                                    {m.temperature && <div style={st.track}><div style={st.bar(hot, Math.min(m.temperature, 100))} /></div>}
                                </div>
                                <div style={st.metric}>
                                    <div style={st.metricLbl}><Activity size={10} />Vibration</div>
                                    <div style={st.metricVal(m.vibration > 2.5)}>{m.vibration ?? '—'}<span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}> mm/s</span></div>
                                </div>
                            </div>

                            <div style={st.actions}>
                                {running
                                    ? <button id={`stop-${m.id}`} style={st.stopBtn} onClick={() => handleCommand(m.id, 'STOP')}><Square size={14} />Stop</button>
                                    : <button id={`start-${m.id}`} style={st.startBtn} onClick={() => handleCommand(m.id, 'START')}><Play size={14} />Start</button>}
                                <button style={st.settingBtn}><Settings size={16} /></button>
                            </div>

                            <div style={st.hb}>Heartbeat: {m.lastHeartbeat ? new Date(m.lastHeartbeat).toLocaleString() : 'Never'}</div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#374151' }}>
                    <Cpu size={40} style={{ margin: '0 auto 12px' }} />
                    <p>No machines match this filter.</p>
                </div>
            )}
        </div>
    );
};

export default MachinesPage;
