import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldAlert, Clock, Cpu, CheckCircle, BellOff, AlertTriangle } from 'lucide-react';

const sevStyle = {
    CRITICAL: { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)', dot: '#ef4444', stripe: '#ef4444' },
    MEDIUM: { background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)', dot: '#f59e0b', stripe: '#f59e0b' },
    LOW: { background: 'rgba(14,165,233,0.08)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.22)', dot: '#0ea5e9', stripe: '#0ea5e9' },
};

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetch = async () => {
            try {
                const r = await api.get('/alerts');
                setAlerts(r.data.content || []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
    }, [filter]);

    const handleAck = async (id) => {
        try {
            await api.post(`/alerts/${id}/acknowledge`);
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
        } catch { alert('Failed to acknowledge'); }
    };

    const filtered = filter === 'all' ? alerts : alerts.filter(a => filter === 'active' ? !a.acknowledged : a.acknowledged);
    const activeCount = alerts.filter(a => !a.acknowledged).length;

    const st = {
        page: { fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb' },
        hdr: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 },
        h1: { fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 },
        sub: { fontSize: 14, color: '#6b7280' },
        live: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '7px 14px' },
        liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444' },
        liveTxt: { fontSize: 12, fontWeight: 700, color: '#f87171' },
        tabs: { display: 'flex', background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, gap: 4 },
        tab: (a) => ({
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: 'none', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.2s',
            ...(a ? { background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white' } : { background: 'transparent', color: '#6b7280' }),
        }),
        list: { display: 'flex', flexDirection: 'column', gap: 12 },
        card: (sev, acked) => ({
            background: 'rgba(17,24,39,0.85)', borderRadius: 16,
            borderLeft: `4px solid ${sevStyle[sev]?.stripe || '#38bdf8'}`,
            border: `1px solid rgba(255,255,255,0.07)`,
            borderLeftColor: sevStyle[sev]?.stripe || '#38bdf8',
            padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'center',
            opacity: acked ? 0.55 : 1, transition: 'all 0.2s', flexWrap: 'wrap',
        }),
        body: { flex: 1, minWidth: 0 },
        tags: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8, alignItems: 'center' },
        sevBadge: (sev) => ({
            fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            ...(sevStyle[sev] || sevStyle.LOW),
        }),
        typeBadge: {
            fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.05)', color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase',
        },
        timeTag: { fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 },
        msg: { fontSize: 15, fontWeight: 600, marginBottom: 6 },
        meta: { fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 },
        ackBtn: {
            padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(14,165,233,0.3)',
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
        },
        resolvedTxt: { fontSize: 13, fontWeight: 600, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={24} color="#f87171" /></div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading alerts…</p>
        </div>
    );

    return (
        <div style={st.page}>
            <div style={st.hdr}>
                <div>
                    <h1 style={st.h1}>Alert Center</h1>
                    <p style={st.sub}>Monitor and resolve system anomalies</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {activeCount > 0 && (
                        <div style={st.live}>
                            <div style={{ ...st.liveDot, animation: 'pulse 2s infinite' }} />
                            <span style={st.liveTxt}>{activeCount} unresolved</span>
                        </div>
                    )}
                    <div style={st.tabs}>
                        {['all', 'active', 'resolved'].map(f => (
                            <button key={f} style={st.tab(filter === f)} onClick={() => setFilter(f)}>{f}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={st.list}>
                {filtered.length > 0 ? filtered.map(a => {
                    const sev = a.severity || 'LOW';
                    return (
                        <div key={a.id} style={st.card(sev, a.acknowledged)}>
                            <div style={st.body}>
                                <div style={st.tags}>
                                    <span style={st.sevBadge(sev)}>{sev}</span>
                                    <span style={st.typeBadge}>{a.type}</span>
                                    <span style={st.timeTag}><Clock size={11} />{new Date(a.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={st.msg}>{a.message}</div>
                                <div style={st.meta}><Cpu size={13} />{a.machineName}</div>
                            </div>
                            {a.acknowledged
                                ? <div style={st.resolvedTxt}><CheckCircle size={16} />Resolved</div>
                                : <button id={`ack-${a.id}`} style={st.ackBtn} onClick={() => handleAck(a.id)}><CheckCircle size={15} />Acknowledge</button>
                            }
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <BellOff size={28} color="#4ade80" />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>All Clear</div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>No alerts matching your filter.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsPage;
