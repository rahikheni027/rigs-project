import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Settings, Sun, Moon, Bell, RefreshCw, Shield, Monitor, Palette, Volume2, Save, Check } from 'lucide-react';

const SettingsPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [refreshRate, setRefreshRate] = useState(localStorage.getItem('rigs-refresh') || '2');
    const [notifications, setNotifications] = useState(localStorage.getItem('rigs-notif') !== 'false');
    const [soundAlerts, setSoundAlerts] = useState(localStorage.getItem('rigs-sound') !== 'false');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        localStorage.setItem('rigs-refresh', refreshRate);
        localStorage.setItem('rigs-notif', notifications);
        localStorage.setItem('rigs-sound', soundAlerts);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const S = {
        card: {
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px', marginBottom: 12,
        },
        label: {
            fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 10,
        },
    };

    const Toggle = ({ value, onChange, label, desc, icon: Icon, color }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                </div>
            </div>
            <button onClick={onChange} style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: value ? '#22c55e' : 'var(--toggle-off)',
                position: 'relative', transition: 'all 0.2s',
            }}>
                <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3,
                    left: value ? 23 : 3, transition: 'left 0.2s',
                }} />
            </button>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-primary)', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Settings size={20} /> SETTINGS
                </h1>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>SYSTEM PREFERENCES & CONFIGURATION</p>
            </div>

            {/* Appearance */}
            <div style={S.card}>
                <div style={S.label}>APPEARANCE</div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {['dark', 'light'].map(t => (
                        <button key={t} onClick={() => { if (theme !== t) toggleTheme(); }} style={{
                            flex: 1, padding: '16px 14px', borderRadius: 10, cursor: 'pointer',
                            border: theme === t ? '2px solid #0ea5e9' : '1px solid var(--border)',
                            background: t === 'dark' ? '#0f172a' : '#f8fafc',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            transition: 'all 0.2s',
                        }}>
                            {t === 'dark' ? <Moon size={20} color={theme === t ? '#38bdf8' : '#64748b'} /> : <Sun size={20} color={theme === t ? '#f59e0b' : '#94a3b8'} />}
                            <span style={{ fontSize: 11, fontWeight: 700, color: t === 'dark' ? '#e2e8f0' : '#1e293b', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{t} Mode</span>
                            {theme === t && <Check size={12} color="#0ea5e9" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data & Monitoring */}
            <div style={S.card}>
                <div style={S.label}>DATA & MONITORING</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCw size={15} color="#0ea5e9" />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Telemetry Refresh Rate</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>How often to poll for new data</div>
                        </div>
                    </div>
                    <select value={refreshRate} onChange={e => setRefreshRate(e.target.value)} style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                    }}>
                        <option value="1">1 second</option>
                        <option value="2">2 seconds</option>
                        <option value="5">5 seconds</option>
                        <option value="10">10 seconds</option>
                    </select>
                </div>

                <Toggle value={notifications} onChange={() => setNotifications(!notifications)}
                    label="Alert Notifications" desc="Show browser notifications for critical alerts"
                    icon={Bell} color="#f59e0b" />
                <Toggle value={soundAlerts} onChange={() => setSoundAlerts(!soundAlerts)}
                    label="Sound Alerts" desc="Play audio for emergency alarms"
                    icon={Volume2} color="#ef4444" />
            </div>

            {/* System Info */}
            <div style={S.card}>
                <div style={S.label}>SYSTEM INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                        { label: 'Version', value: 'R.I.G.S. v3.0' },
                        { label: 'Protocol', value: 'MQTT/TLS' },
                        { label: 'Backend', value: 'Spring Boot' },
                        { label: 'Frontend', value: 'React + Vite' },
                    ].map(item => (
                        <div key={item.label} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save */}
            <button onClick={handleSave} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px',
                background: saved ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg,#0ea5e9,#2563eb)',
                color: saved ? '#4ade80' : 'white',
                border: saved ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(14,165,233,0.2)',
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s',
            }}>
                {saved ? <><Check size={14} /> SAVED</> : <><Save size={14} /> SAVE SETTINGS</>}
            </button>
        </div>
    );
};

export default SettingsPage;
