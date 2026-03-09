import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_COLORS = {
    success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#4ade80', icon: CheckCircle2 },
    error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171', icon: AlertCircle },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', icon: AlertTriangle },
    info: { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)', color: '#38bdf8', icon: Info },
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, []);

    const showToast = useCallback((message, type = 'info') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container */}
            <div style={{
                position: 'fixed', top: 20, right: 20, zIndex: 9999,
                display: 'flex', flexDirection: 'column', gap: 10,
                pointerEvents: 'none', maxWidth: 400,
            }}>
                {toasts.map(toast => {
                    const scheme = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
                    const Icon = scheme.icon;
                    return (
                        <div
                            key={toast.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '14px 18px',
                                background: scheme.bg,
                                border: `1px solid ${scheme.border}`,
                                borderRadius: 14,
                                backdropFilter: 'blur(20px)',
                                color: '#f9fafb',
                                fontFamily: 'Inter, system-ui, sans-serif',
                                fontSize: 13, fontWeight: 500,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                pointerEvents: 'auto',
                                animation: toast.exiting
                                    ? 'toastSlideOut 0.35s ease-in forwards'
                                    : 'toastSlideIn 0.35s ease-out',
                                willChange: 'transform, opacity',
                            }}
                        >
                            <Icon size={18} color={scheme.color} style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#6b7280', padding: 2, display: 'flex', flexShrink: 0,
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
            {/* Keyframes injected once */}
            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0);    opacity: 1; }
                    to   { transform: translateX(120%); opacity: 0; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
