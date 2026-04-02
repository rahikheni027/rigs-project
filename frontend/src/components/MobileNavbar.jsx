import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMachines } from '../context/MachineContext';
import { Zap, Wifi, WifiOff, Menu, X, RefreshCw } from 'lucide-react';

const MobileNavbar = ({ onMenuToggle, menuOpen }) => {
    const { user } = useAuth();
    const { isOnline, reconnect } = useMachines();

    if (!user) return null;

    return (
        <nav className="mobile-navbar sticky top-0 z-[100] h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex justify-between items-center px-6 h-full">
                {/* Brand Layer */}
                <Link to="/app/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Zap size={20} color="white" fill="white" />
                    </div>
                    <div>
                        <div className="text-sm font-black tracking-tight text-white leading-tight">R.I.G.S.</div>
                        <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest leading-tight">PRECISION</div>
                    </div>
                </Link>

                {/* Tactical Layer */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{isOnline ? 'ON' : 'OFF'}</span>
                        {!isOnline && (
                            <button onClick={reconnect} className="ml-2 pl-2 border-l border-white/10 active:scale-90 transition-transform">
                                <RefreshCw size={12} className="text-rose-400" />
                            </button>
                        )}
                    </div>

                    <button 
                        className="w-10 h-10 flex items-center justify-center text-slate-400 active:bg-white/5 rounded-full transition-colors"
                        onClick={onMenuToggle}
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default MobileNavbar;
