import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Thermometer, Activity, Zap, Gauge, Wind, BarChart3, AlertTriangle,
    Play, Square, OctagonX, RotateCcw, Wrench, SlidersHorizontal,
    Cpu, ChevronRight, Signal, CircleDot
} from 'lucide-react';

const STATUS_CONFIG = {
    RUNNING: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'RUNNING', pulse: true },
    STOPPED: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', label: 'STOPPED', pulse: false },
    EMERGENCY: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', label: 'EMERGENCY', pulse: true },
    MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'MAINTENANCE', pulse: false },
    CALIBRATING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', label: 'CALIBRATING', pulse: true },
    OFFLINE: { color: '#4b5563', bg: 'rgba(75,85,99,0.1)', border: 'rgba(75,85,99,0.25)', label: 'OFFLINE', pulse: false },
};

const COMMANDS = [
    { cmd: 'START', icon: Play, label: 'Start', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { cmd: 'STOP', icon: Square, label: 'Stop', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    { cmd: 'EMERGENCY_STOP', icon: OctagonX, label: 'E-Stop', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { cmd: 'RESET', icon: RotateCcw, label: 'Reset', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { cmd: 'MAINTENANCE_MODE', icon: Wrench, label: 'Maint.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { cmd: 'CALIBRATION', icon: SlidersHorizontal, label: 'Calibrate', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
];

const GaugeBar = ({ value, max, color, label, unit, warn }) => {
    const pct = Math.min((value / max) * 100, 100);
    const isWarn = warn && value > warn;
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: isWarn ? '#f87171' : color, fontVariantNumeric: 'tabular-nums' }}>
                    {value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '—'}{unit && <span style={{ fontSize: 10, fontWeight: 400, color: '#6b7280', marginLeft: 2 }}>{unit}</span>}
                </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
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
        intervalRef.current = setInterval(fetchMachines, 3000);
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

    const filters = ['all', 'RUNNING', 'STOPPED', 'EMERGENCY', 'MAINTENANCE', 'CALIBRATING'];
    const filtered = filter === 'all' ? machines : machines.filter(m => m.status === filter);
    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    const avgTemp = machines.length ? (machines.reduce((s, m) => s + (m.temperature || 0), 0) / machines.length).toFixed(1) : '—';
    const totalPower = machines.reduce((s, m) => s + (m.powerConsumption || 0), 0).toFixed(1);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={22} color="#38bdf8" style={{ animation: 'pulse 1.5s infinite' }} />
            </div>
            <p style={{ color: '#6b7280', fontSize: 13 }}>Initializing SCADA interface…</p>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>Machine Control Center</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '4px 10px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>SCADA Industrial Monitoring & Control System</p>
                </div>
            </div>

            {/* KPI Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
                {[
                    { label: 'Total Machines', value: machines.length, icon: Cpu, color: '#38bdf8' },
                    { label: 'Running', value: runCount, icon: Signal, color: '#22c55e' },
                    { label: 'Alerts', value: alertCount, icon: AlertTriangle, color: alertCount > 0 ? '#ef4444' : '#6b7280' },
                    { label: 'Avg Temp', value: `${avgTemp}°C`, icon: Thermometer, color: '#f59e0b' },
                    { label: 'Total Power', value: `${totalPower} kW`, icon: Zap, color: '#8b5cf6' },
                ].map(kpi => (
                    <div key={kpi.label} style={{
                        background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <kpi.icon size={16} color={kpi.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 3, marginBottom: 16, overflowX: 'auto' }}>
                {filters.map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: 'none', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.04em',
                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                        ...(filter === f
                            ? { background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white' }
                            : { background: 'transparent', color: '#6b7280' }),
                    }}>{f === 'all' ? `All (${machines.length})` : `${f} (${machines.filter(m => m.status === f).length})`}</button>
                ))}
            </div>

            {/* Machine cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
                {filtered.map(m => {
                    const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.OFFLINE;
                    return (
                        <div key={m.machineId} style={{
                            background: 'rgba(17,24,39,0.9)', border: `1px solid ${sc.border}`,
                            borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s',
                        }}>
                            {/* Status stripe */}
                            <div style={{ height: 3, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}66)` }} />

                            <div style={{ padding: '14px 18px' }}>
                                {/* Machine header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 10, background: sc.bg, border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Cpu size={16} color={sc.color} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>{m.machineName}</div>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>{m.location} · {(m.cumulativeRuntimeHours || 0).toFixed(0)}h runtime</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            {sc.pulse && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: sc.color, marginRight: 5, animation: 'pulse 1.5s infinite' }} />}
                                            {sc.label}
                                        </span>
                                        <Link to={`/app/machines/${m.machineId}`} style={{ color: '#6b7280', display: 'flex' }} title="Analytics">
                                            <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </div>

                                {/* Telemetry gauges - 2 rows of 3 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                                    <GaugeBar value={m.temperature} max={120} color="#f59e0b" label="Temp" unit="°C" warn={85} />
                                    <GaugeBar value={m.rpm} max={4000} color="#3b82f6" label="RPM" unit="" />
                                    <GaugeBar value={m.vibration} max={10} color="#8b5cf6" label="Vibration" unit="g" warn={5} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                                    <GaugeBar value={m.pressure} max={150} color="#06b6d4" label="Pressure" unit="PSI" warn={100} />
                                    <GaugeBar value={m.powerConsumption} max={30} color="#ec4899" label="Power" unit="kW" />
                                    <GaugeBar value={m.efficiency} max={100} color="#22c55e" label="Efficiency" unit="%" />
                                </div>

                                {/* Error rate indicator */}
                                {m.errorRate != null && m.errorRate > 0.03 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px',
                                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8,
                                        fontSize: 11, color: '#f87171', fontWeight: 600,
                                    }}>
                                        <AlertTriangle size={12} />
                                        Error rate elevated: {(m.errorRate * 100).toFixed(1)}%
                                    </div>
                                )}

                                {/* Command buttons */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                                    {COMMANDS.map(c => {
                                        const isActive = cmdLoading[`${m.machineId}-${c.cmd}`];
                                        return (
                                            <button key={c.cmd} onClick={() => handleCommand(m.machineId, c.cmd)} disabled={isActive}
                                                style={{
                                                    padding: '7px 2px', borderRadius: 8, border: `1px solid ${c.color}30`, cursor: 'pointer',
                                                    background: isActive ? c.bg : 'transparent', color: c.color, fontSize: 9, fontWeight: 700,
                                                    fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                                    transition: 'all 0.15s', opacity: isActive ? 0.6 : 1, textTransform: 'uppercase', letterSpacing: '0.03em',
                                                }}
                                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = c.bg; e.currentTarget.style.borderColor = `${c.color}60`; } }}
                                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${c.color}30`; } }}
                                            >
                                                <c.icon size={13} />
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
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
                    <Cpu size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No machines matching filter</div>
                </div>
            )}
        </div>
    );
};

export default MachinesPage;
