import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldAlert, Clock, Cpu, CheckCircle, BellOff, AlertTriangle, Filter, RefreshCw, Download, Volume2 } from 'lucide-react';

const sevStyle = {
    CRITICAL: { background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', stripe: '#ef4444' },
    MEDIUM: { background: 'rgba(245,158,11,0.06)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)', stripe: '#f59e0b' },
    LOW: { background: 'rgba(14,165,233,0.06)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.15)', stripe: '#0ea5e9' },
};

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchAlerts = async () => {
            try {
                const r = await api.get('/alerts', { signal: controller.signal });
                if (!isMounted) return;
                setAlerts(r.data.content || []);
            } catch (e) { 
                if (!isMounted || e.name === 'CanceledError') return;
                console.error(e); 
            } finally { 
                if (isMounted) setLoading(false); 
            }
        };

        fetchAlerts();
        let t;
        if (autoRefresh) {
            t = setInterval(fetchAlerts, 10000);
        }
        
        return () => {
            isMounted = false;
            if (t) clearInterval(t);
            controller.abort();
        };
    }, [filter, autoRefresh]);

    const handleAck = async (id) => {
        try {
            await api.post(`/alerts/${id}/acknowledge`);
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
        } catch { alert('Failed to acknowledge'); }
    };

    const exportCSV = () => {
        const headers = ['ID', 'Machine', 'Type', 'Severity', 'Message', 'Created', 'Status'];
        const rows = alerts.map(a => [a.id, a.machineName, a.type, a.severity, `"${a.message}"`, a.createdAt, a.acknowledged ? 'Resolved' : 'Active']);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `rigs_alerts_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = filter === 'all' ? alerts : alerts.filter(a => filter === 'active' ? !a.acknowledged : a.acknowledged);
    const activeCount = alerts.filter(a => !a.acknowledged).length;
    const critCount = alerts.filter(a => !a.acknowledged && a.severity === 'CRITICAL').length;
    const medCount = alerts.filter(a => !a.acknowledged && a.severity === 'MEDIUM').length;
    const lowCount = alerts.filter(a => !a.acknowledged && a.severity === 'LOW').length;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={22} color="#f87171" style={{ animation: 'pulse 1.5s infinite' }} />
            </div>
            <p style={{ color: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>LOADING ALARM SYSTEM...</p>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f1f5f9' }}>
            {/* Critical Banner */}
            {critCount > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 6, marginBottom: 14, animation: 'alarm-flash 2s ease-in-out infinite',
                }}>
                    <Volume2 size={14} color="#ef4444" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>
                        ⚠ {critCount} CRITICAL ALARM{critCount > 1 ? 'S' : ''} REQUIRE IMMEDIATE ATTENTION
                    </span>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>ALARM CENTER</h1>
                    <p style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>MONITOR AND RESOLVE SYSTEM ANOMALIES</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Alarm Summary Badges */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[
                            { label: 'CRIT', count: critCount, color: '#ef4444' },
                            { label: 'WARN', count: medCount, color: '#f59e0b' },
                            { label: 'INFO', count: lowCount, color: '#0ea5e9' },
                        ].map(b => (
                            <div key={b.label} style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                                background: `${b.color}08`, border: `1px solid ${b.color}20`, borderRadius: 4,
                            }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: b.color, animation: b.count > 0 ? 'alarm-flash 1.5s infinite' : 'none' }} />
                                <span style={{ fontSize: 9, fontWeight: 700, color: b.color, fontFamily: "'JetBrains Mono', monospace" }}>{b.label}: {b.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Auto-refresh toggle */}
                    <button onClick={() => setAutoRefresh(!autoRefresh)} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                        background: autoRefresh ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                        border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                        borderRadius: 4, color: autoRefresh ? '#4ade80' : '#f87171', fontSize: 9, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        <RefreshCw size={10} style={{ animation: autoRefresh ? 'pulse 2s infinite' : 'none' }} />
                        {autoRefresh ? 'AUTO 5s' : 'PAUSED'}
                    </button>

                    {/* Export */}
                    <button onClick={exportCSV} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                        background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                        borderRadius: 4, color: '#38bdf8', fontSize: 9, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        <Download size={10} /> EXPORT
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.06)', borderRadius: 6, padding: 3, marginBottom: 14 }}>
                {['all', 'active', 'resolved'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '5px 14px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        border: 'none', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                        transition: 'all 0.2s',
                        ...(filter === f
                            ? { background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white' }
                            : { background: 'transparent', color: '#64748b' }),
                    }}>
                        {f}{f === 'active' ? ` (${activeCount})` : f === 'all' ? ` (${alerts.length})` : ` (${alerts.length - activeCount})`}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.length > 0 ? filtered.map(a => {
                    const sev = a.severity || 'LOW';
                    const ss = sevStyle[sev] || sevStyle.LOW;
                    return (
                        <div key={a.id} style={{
                            background: 'rgba(15,23,42,0.9)', borderRadius: 8,
                            borderLeft: `3px solid ${ss.stripe}`,
                            border: '1px solid rgba(14,165,233,0.06)',
                            borderLeftColor: ss.stripe,
                            padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center',
                            opacity: a.acknowledged ? 0.5 : 1, transition: 'all 0.2s', flexWrap: 'wrap',
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 3,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        background: ss.background, color: ss.color, border: ss.border,
                                    }}>{sev}</span>
                                    <span style={{
                                        fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                                        background: 'rgba(14,165,233,0.04)', color: '#94a3b8',
                                        border: '1px solid rgba(14,165,233,0.08)', fontFamily: "'JetBrains Mono', monospace",
                                    }}>{a.type}</span>
                                    <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                                        <Clock size={10} />{new Date(a.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{a.message}</div>
                                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                                    <Cpu size={11} />{a.machineName}
                                </div>
                            </div>
                            {a.acknowledged
                                ? <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}><CheckCircle size={14} />RESOLVED</div>
                                : <button id={`ack-${a.id}`} onClick={() => handleAck(a.id)} style={{
                                    padding: '7px 14px', borderRadius: 6, border: '1px solid rgba(14,165,233,0.2)',
                                    background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white',
                                    fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                    fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', flexShrink: 0,
                                }}>
                                    <CheckCircle size={12} />ACK
                                </button>
                            }
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <BellOff size={24} color="#4ade80" />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>ALL CLEAR</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>No alarms matching your filter.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsPage;
