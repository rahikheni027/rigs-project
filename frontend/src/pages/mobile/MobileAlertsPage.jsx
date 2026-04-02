import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ShieldAlert, Clock, CheckCircle, BellOff, AlertTriangle, Filter, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertsPageMobile = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active, all

    useEffect(() => {
        let isMounted = true;
        const fetchAlerts = async () => {
            try {
                const r = await api.get('/alerts?size=20');
                if (!isMounted) return;
                setAlerts(r.data.content || []);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAlerts();
        const t = setInterval(fetchAlerts, 10000);
        return () => { isMounted = false; clearInterval(t); };
    }, []);

    const handleAck = async (id) => {
        try {
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
            await api.post(`/alerts/${id}/acknowledge`);
        } catch {
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: false } : a));
        }
    };

    const filtered = filter === 'active' ? alerts.filter(a => !a.acknowledged) : alerts;
    const activeCount = alerts.filter(a => !a.acknowledged).length;

    if (loading) return (
        <div className="mobile-loading">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <ShieldAlert size={32} color="#ef4444" className="animate-pulse" />
            </div>
            <p className="text-[10px] font-black tracking-[0.3em] text-rose-400 uppercase">Scanning Nodes...</p>
        </div>
    );

    return (
        <div className="m-dashboard px-6 pb-24">
            <div className="flex justify-between items-end mb-8 pt-4">
                <div>
                    <h1 className="m-dashboard__title !mb-0">Incidents</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time Anomaly Tracking</p>
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400">
                    <Filter size={20} />
                </div>
            </div>

            {/* Premium Segment Control */}
            <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-8">
                <button 
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${filter === 'active' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500'}`}
                    onClick={() => setFilter('active')}
                >
                    ACTIVE <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-[10px]">{activeCount}</span>
                </button>
                <button 
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${filter === 'all' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500'}`}
                    onClick={() => setFilter('all')}
                >
                    ARCHIVE
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filtered.map((a, i) => {
                        const isCrit = a.severity === 'CRITICAL';
                        const color = isCrit ? '#ef4444' : a.severity === 'MEDIUM' ? '#f59e0b' : '#0ea5e9';
                        
                        return (
                            <motion.div 
                                key={a.id} 
                                layout 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-5 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden ${a.acknowledged ? 'opacity-40 grayscale-[0.5]' : ''}`}
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: color }} />
                                
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
                                            <AlertTriangle size={14} style={{ color }} />
                                        </div>
                                        <span className="text-xs font-black text-white tracking-tight">{a.machineName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                                        <Clock size={12} />
                                        {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                
                                <div className="text-sm font-medium text-slate-200 mb-6 leading-relaxed">
                                    {a.message}
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest" style={{ color, background: `${color}15` }}>
                                        {a.severity}
                                    </span>
                                    
                                    {!a.acknowledged ? (
                                        <button 
                                            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl text-[10px] font-black text-white tracking-widest border border-white/10"
                                            onClick={() => handleAck(a.id)}
                                        >
                                            ACKNOWLEDGE
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] tracking-widest">
                                            <ShieldCheck size={14} /> RESOLVED
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {filtered.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center gap-6">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                            <ShieldCheck size={32} className="text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Clear Horizon</div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No active anomalies detected</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsPageMobile;
