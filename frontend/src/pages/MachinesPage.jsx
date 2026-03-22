import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Thermometer, Activity, Zap, Gauge, Wind, BarChart3, AlertTriangle,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal,
    Cpu, ChevronRight, Signal, CircleDot, Droplets, Fan, Cog, Download
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', label: 'RUNNING', pulse: true },
    STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.15)', label: 'STOPPED', pulse: false },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'EMERGENCY', pulse: true },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', label: 'MAINTENANCE', pulse: false },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', label: 'CALIBRATING', pulse: true },
    OFFLINE: { color: '#475569', bg: 'rgba(71,85,105,0.06)', border: 'rgba(71,85,105,0.15)', label: 'OFFLINE', pulse: false },
};

const MACHINE_ICONS = {
    PUMP: Droplets, MOTOR: Cog, COMPRESSOR: Fan, TURBINE: Activity, GENERATOR: Zap,
};

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'Start', color: '#22c55e', bg: 'rgba(34,197,94,0.06)' },
    { cmd: 'STOP', icon: Square, label: 'Stop', color: '#64748b', bg: 'rgba(100,116,139,0.06)' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'E-Stop', color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
    { cmd: 'RESET', icon: RotateCcw, label: 'Reset', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'Maint.', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, label: 'Cal', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
];

const GaugeBar = ({ value, max, color, label, unit, warn }) => {
    const pct = Math.min(((value || 0) / max) * 100, 100);
    const isWarn = warn && (value || 0) > warn;
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'baseline' }}>
                <span style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isWarn ? '#f87171' : color, fontFamily: "'JetBrains Mono', monospace" }}>
                    {value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '--'}{unit && <span style={{ fontSize: 8, fontWeight: 400, color: '#64748b', marginLeft: 1 }}>{unit}</span>}
                </span>
            </div>
            <div style={{ height: 4, background: 'rgba(14,165,233,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 2, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    width: `${pct}%`,
                    background: isWarn ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : `linear-gradient(90deg, ${color}88, ${color})`,
                }} />
            </div>
        </div>
    );
};

const MachinesPage = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [cmdLoading, setCmdLoading] = useState({});
    const { user } = useAuth();
    const intervalRef = useRef(null);

    const fetchMachines = async () => {
        try {
            const r = await api.get('/machines');
            setMachines(r.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchMachines();
        intervalRef.current = setInterval(fetchMachines, 10000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const handleCommand = async (id, cmd) => {
        setCmdLoading(p => ({ ...p, [`${id}-${cmd}`]: true }));
        try {
            await api.post(`/machines/${id}/command?command=${cmd}&issuedBy=${user?.name || 'operator'}`);
            setTimeout(fetchMachines, 800);
        } catch (e) {
            console.error('Command failed:', e);
        } finally {
            setTimeout(() => setCmdLoading(p => ({ ...p, [`${id}-${cmd}`]: false })), 1200);
        }
    };

    const exportCSV = () => {
        const headers = ['Machine', 'Status', 'Type', 'Location', 'Temp(°C)', 'RPM', 'Vibration(g)', 'Pressure(PSI)', 'Power(kW)', 'Efficiency(%)', 'ErrorRate'];
        const rows = machines.map(m => [m.machineName, m.status, m.machineType || 'N/A', m.location, m.temperature?.toFixed(1) || '', m.rpm?.toFixed(0) || '', m.vibration?.toFixed(2) || '', m.pressure?.toFixed(1) || '', m.powerConsumption?.toFixed(2) || '', m.efficiency?.toFixed(1) || '', m.errorRate?.toFixed(3) || '']);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `rigs_machines_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const filters = ['all', 'RUNNING', 'STOPPED', 'EMERGENCY', 'MAINTENANCE', 'CALIBRATING'];
    const filtered = filter === 'all' ? machines : machines.filter(m => m.status === filter);
    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length).toFixed(1) : '--';
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0).toFixed(1);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={22} color="#0ea5e9" style={{ animation: 'pulse 1.5s infinite' }} />
            </div>
            <p style={{ color: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>INITIALIZING MACHINE CONTROL...</p>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f1f5f9' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>MACHINE CONTROL CENTER</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 4, padding: '3px 8px' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>SCADA SUPERVISORY CONTROL & DATA ACQUISITION</p>
                </div>
                <button onClick={exportCSV} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                    borderRadius: 6, color: '#38bdf8', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                }}>
                    <Download size={12} /> EXPORT CSV
                </button>
            </div>

            {/* KPI Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
                {[
                    { label: 'Total Machines', value: machines.length, icon: Cpu, color: '#0ea5e9' },
                    { label: 'Running', value: runCount, icon: Signal, color: '#22c55e' },
                    { label: 'Alerts', value: alertCount, icon: AlertTriangle, color: alertCount > 0 ? '#ef4444' : '#64748b' },
                    { label: 'Avg Temp', value: `${avgTemp}°C`, icon: Thermometer, color: '#f59e0b' },
                    { label: 'Total Power', value: `${totalPower} kW`, icon: Zap, color: '#a855f7' },
                ].map(kpi => (
                    <div key={kpi.label} style={{
                        background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.06)',
                        borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: `${kpi.color}10`, border: `1px solid ${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <kpi.icon size={14} color={kpi.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>{kpi.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.06)', borderRadius: 6, padding: 3, marginBottom: 14, overflowX: 'auto' }}>
                {filters.map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '5px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        border: 'none', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em',
                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                        ...(filter === f
                            ? { background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white' }
                            : { background: 'transparent', color: '#64748b' }),
                    }}>{f === 'all' ? `ALL (${machines.length})` : `${f} (${machines.filter(m => m.status === f).length})`}</button>
                ))}
            </div>

            {/* Machine cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 12 }}>
                {filtered.map(m => {
                    const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                    const MIcon = MACHINE_ICONS[m.machineType] || Cpu;
                    return (
                        <div key={m.machineId} style={{
                            background: 'rgba(15,23,42,0.9)', border: `1px solid ${sc.border}`,
                            borderRadius: 10, overflow: 'hidden', transition: 'all 0.3s',
                        }}>
                            {/* Status stripe */}
                            <div style={{ height: 2, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}44)` }} />

                            <div style={{ padding: '12px 16px' }}>
                                {/* Machine header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 7, background: sc.bg, border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MIcon size={14} color={sc.color} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px' }}>{m.machineName}</div>
                                            <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                                                {m.location} · {m.machineType || 'MOTOR'} · {m.processUnit || 'Unit A'} · {(m.cumulativeRuntimeHours || 0).toFixed(0)}h
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{
                                            fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 3,
                                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}>
                                            {sc.pulse && <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: sc.color, marginRight: 4, animation: m.status === 'EMERGENCY' ? 'alarm-flash 0.8s infinite' : 'pulse 1.5s infinite' }} />}
                                            {sc.label}
                                        </span>
                                        <Link to={`/app/machines/${m.machineId}`} style={{ color: '#64748b', display: 'flex' }} title="Analytics">
                                            <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>

                                {/* Telemetry gauges */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                                    <GaugeBar value={m.temperature} max={120} color="#f59e0b" label="Temp" unit="°C" warn={85} />
                                    <GaugeBar value={m.rpm} max={4000} color="#3b82f6" label="RPM" unit="" />
                                    <GaugeBar value={m.vibration} max={10} color="#8b5cf6" label="Vibration" unit="g" warn={5} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                                    <GaugeBar value={m.pressure} max={150} color="#06b6d4" label="Pressure" unit="PSI" warn={100} />
                                    <GaugeBar value={m.powerConsumption} max={30} color="#a855f7" label="Power" unit="kW" />
                                    <GaugeBar value={m.efficiency} max={100} color="#22c55e" label="Efficiency" unit="%" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                                    <GaugeBar value={m.currentDraw} max={20} color="#ec4899" label="Current" unit="A" />
                                    <GaugeBar value={m.errorRate != null ? m.errorRate * 100 : null} max={15} color="#ef4444" label="Error Rate" unit="%" warn={5} />
                                </div>

                                {/* Command buttons */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
                                    {COMMANDS.map(c => {
                                        const isActive = cmdLoading[`${m.machineId}-${c.cmd}`];
                                        return (
                                            <button key={c.cmd} onClick={() => handleCommand(m.machineId, c.cmd)} disabled={isActive}
                                                style={{
                                                    padding: '6px 2px', borderRadius: 5, border: `1px solid ${c.color}20`, cursor: 'pointer',
                                                    background: isActive ? c.bg : 'transparent', color: c.color, fontSize: 8, fontWeight: 700,
                                                    fontFamily: "'JetBrains Mono', monospace", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                                    transition: 'all 0.15s', opacity: isActive ? 0.6 : 1, textTransform: 'uppercase',
                                                }}
                                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = c.bg; e.currentTarget.style.borderColor = `${c.color}40`; } }}
                                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${c.color}20`; } }}
                                            >
                                                <c.icon size={11} />
                                                {c.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <Cpu size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>NO MACHINES MATCHING FILTER</div>
                </div>
            )}
        </div>
    );
};

export default MachinesPage;
