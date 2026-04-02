import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useMachines } from '../../context/MachineContext';
import {
    Cpu, Thermometer, Zap, AlertTriangle, BarChart3, Activity,
    Shield, ChevronRight, ChevronDown, ChevronUp, Wifi, Signal, ZapOff,
    Play, Square, RefreshCcw, Power, Clock
} from 'lucide-react';

/* ─── Premium Mobile Components ─── */

const MobileOEEHeader = ({ value }) => {
    const strokeColor = value >= 85 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
    const label = value >= 85 ? 'OPTIMAL' : value >= 60 ? 'STABLE' : 'CRITICAL';

    return (
        <div className="m-oee-card">
            <div className="m-oee-card__bg" style={{ background: strokeColor }} />
            <div className="m-oee-card__content">
                <div className="m-oee-card__text">
                    <div className="m-oee-card__label">PLANT EFFICIENCY</div>
                    <div className="m-oee-card__value">{value.toFixed(1)}%</div>
                    <div className="m-oee-card__status" style={{ color: strokeColor }}>{label}</div>
                </div>
                <div className="m-oee-card__icon">
                    <Activity size={32} style={{ color: strokeColor }} />
                </div>
            </div>
        </div>
    );
};

const QuickControlCard = ({ machine, onAction }) => {
    const isRunning = machine.status === 'RUNNING';
    const isError = machine.status === 'EMERGENCY';
    
    return (
        <div className={`m-control-card ${isRunning ? 'm-control-card--active' : ''}`}>
            <div className="m-control-card__header">
                <div className="m-control-card__title">
                    <h3>{machine.machineName}</h3>
                    <div className="m-control-card__meta">
                        <Signal size={10} /> {machine.status}
                    </div>
                </div>
                <div className="m-control-card__temp">
                    <Thermometer size={14} /> {machine.temperature?.toFixed(0)}°
                </div>
            </div>

            <div className="m-control-card__actions">
                {!isRunning ? (
                    <button 
                        className="m-btn m-btn--primary m-btn--large"
                        onClick={() => onAction(machine.machineId, 'START')}
                    >
                        <Play size={20} fill="currentColor" /> START
                    </button>
                ) : (
                    <button 
                        className="m-btn m-btn--danger m-btn--large"
                        onClick={() => onAction(machine.machineId, 'STOP')}
                    >
                        <Square size={20} fill="currentColor" /> STOP
                    </button>
                )}
                <button className="m-btn m-btn--ghost m-btn--large">
                    <RefreshCcw size={20} /> RESET
                </button>
            </div>
        </div>
    );
};

const MetricRow = ({ icon: Icon, label, value, color }) => (
    <div className="m-metric-inline">
        <div className="m-metric-inline__icon" style={{ color }}>
            <Icon size={16} />
        </div>
        <div className="m-metric-inline__label">{label}</div>
        <div className="m-metric-inline__value">{value}</div>
    </div>
);

/* ═══════════════════════════════════════════ */
/*        MAIN MOBILE DASHBOARD               */
/* ═══════════════════════════════════════════ */

const MobileDashboard = () => {
    const { machines, cascadingFailure, isOnline, sendCommand } = useMachines();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await api.get('/alerts?size=5');
                setAlerts(res.data.content || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchAlerts();
    }, []);

    const handleMachineAction = async (id, action) => {
        try {
            await sendCommand(id, action);
        } catch (e) {
            console.error('Command failed', e);
        }
    };

    const runCount = machines.filter(m => m.status === 'RUNNING').length;
    const alertCount = machines.filter(m => m.status === 'EMERGENCY' || m.maintenanceAlert).length;
    
    // OEE Simplified
    const oee = machines.length > 0 ? (runCount / machines.length) * 100 : 0;

    if (loading && machines.length === 0) return (
        <div className="mobile-loading">
            <div className="mobile-loading__icon"><Signal size={32} color="#0ea5e9" className="animate-pulse" /></div>
            <p className="mobile-loading__text tracking-[0.2em]">LOADING GRID...</p>
        </div>
    );

    return (
        <div className="m-dashboard">
            {/* Real-time Status */}
            <div className="m-dashboard__top">
                <div className={`m-status-chip ${isOnline ? 'm-status-chip--on' : 'm-status-chip--off'}`}>
                    <div className="m-status-chip__dot" />
                    {isOnline ? 'SYSTEM CONNECTED' : 'SYSTEM OFFLINE'}
                </div>
                <div className="m-dashboard__time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            <h1 className="m-dashboard__title">Dashboard</h1>
            
            {/* Featured OEE Card */}
            <MobileOEEHeader value={oee} />

            {/* Quick Metrics Multi-Grid */}
            <div className="m-metrics-grid">
                <div className="m-metric-box">
                    <div className="m-metric-box__val text-emerald-400">{runCount}</div>
                    <div className="m-metric-box__label">ONLINE</div>
                </div>
                <div className="m-metric-box">
                    <div className={`m-metric-box__val ${alertCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{alertCount}</div>
                    <div className="m-metric-box__label">ALERTS</div>
                </div>
                <div className="m-metric-box">
                    <div className="m-metric-box__val text-sky-400">1.2ms</div>
                    <div className="m-metric-box__label">LATENCY</div>
                </div>
            </div>

            {/* Priority Section: Machine Quick Controls */}
            <div className="m-section">
                <div className="m-section__head">
                    <h2 className="m-section__title">Priority Fleet</h2>
                    <Link to="/app/machines" className="m-section__link">View All</Link>
                </div>
                <div className="m-cards-scroll">
                    {machines.length > 0 ? (
                        machines.slice(0, 3).map(m => (
                            <QuickControlCard 
                                key={m.machineId} 
                                machine={m} 
                                onAction={handleMachineAction} 
                            />
                        ))
                    ) : (
                        <div className="m-empty-state">No Active Nodes</div>
                    )}
                </div>
            </div>

            {/* Incident Alert Stack */}
            <div className="m-section">
                <div className="m-section__head">
                    <h2 className="m-section__title">Recent Incidents</h2>
                </div>
                <div className="m-alert-stack">
                    {alerts.length > 0 ? (
                        alerts.map(a => (
                            <div key={a.id} className={`m-alert-item m-alert-item--${a.severity.toLowerCase()}`}>
                                <AlertTriangle size={16} />
                                <div className="m-alert-item__body">
                                    <div className="m-alert-item__msg">{a.message}</div>
                                    <div className="m-alert-item__time">{a.machineName}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="m-alert-empty">All Systems Nominal</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileDashboard;
