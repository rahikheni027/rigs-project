import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Activity, Cpu, BarChart3, Wifi, ChevronRight, CheckCircle, Server } from 'lucide-react';

const features = [
    {
        icon: Activity,
        title: 'Real-Time Monitoring',
        desc: 'Live telemetry data from every machine – temperature, vibration, current draw – updating every 10 seconds.',
        color: '#38bdf8',
    },
    {
        icon: Shield,
        title: 'Smart Alert System',
        desc: 'Intelligent threshold-based alerts for overheating, excessive vibration and offline machines with priority triage.',
        color: '#818cf8',
    },
    {
        icon: Cpu,
        title: 'Remote Command Center',
        desc: 'Start, stop, and configure machines remotely from any browser. Full audit trail of every command sent.',
        color: '#34d399',
    },
    {
        icon: BarChart3,
        title: 'Analytics & Reporting',
        desc: 'Visualise historical telemetry, detect trends, and export reports for compliance and maintenance planning.',
        color: '#fb923c',
    },
    {
        icon: Wifi,
        title: 'MQTT Integration',
        desc: 'Lightweight MQTT protocol keeps your machines connected with minimal latency even on constrained networks.',
        color: '#f472b6',
    },
    {
        icon: Server,
        title: 'Enterprise Security',
        desc: 'JWT authentication, role-based access control, OAuth2 support, and comprehensive audit logging.',
        color: '#a78bfa',
    },
];

const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<100ms', label: 'Avg Latency' },
    { value: '20+', label: 'Machine Types' },
    { value: 'Real-time', label: 'Data Updates' },
];

const LandingPage = () => {
    return (
        <div style={{ minHeight: '100vh', background: '#030712', color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

            {/* NAV */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(3, 7, 18, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 24px',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', borderRadius: 12, padding: 8, boxShadow: '0 0 20px rgba(14,165,233,0.4)' }}>
                            <Zap size={20} color="white" />
                        </div>
                        <div>
                            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' }}>R.I.G.S.</span>
                            <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.05em', marginTop: -2, fontWeight: 600, textTransform: 'uppercase' }}>
                                Industrial Governance
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px', borderRadius: 8, transition: 'all 0.2s' }}
                            onMouseEnter={e => e.target.style.color = '#f9fafb'}
                            onMouseLeave={e => e.target.style.color = '#9ca3af'}>
                            Sign In
                        </Link>
                        <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: 14 }}>
                            Get Started <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section style={{ position: 'relative', padding: '120px 24px 100px', textAlign: 'center', overflow: 'hidden' }}>
                {/* bg glow */}
                <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '60%', left: '20%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', animation: 'pulse-dot 2s infinite' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8', letterSpacing: '0.05em' }}>Live Industrial Monitoring Platform</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 24 }}>
                        Control Your{' '}
                        <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Industrial Fleet
                        </span>
                        <br />from Anywhere
                    </h1>

                    <p style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px', fontWeight: 400 }}>
                        R.I.G.S. delivers real-time machine telemetry, intelligent alerting, and remote command capabilities for modern industrial operations.
                    </p>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: 15, padding: '12px 28px' }}>
                            Start Monitoring Free <ChevronRight size={18} />
                        </Link>
                        <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 15, padding: '12px 28px' }}>
                            Sign In to Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* STATS BAR */}
            <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(17,24,39,0.4)', padding: '40px 24px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
                    {stats.map(s => (
                        <div key={s.label}>
                            <div style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
                            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Capabilities</p>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                        Everything you need to govern<br />your industrial operations
                    </h2>
                    <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>Built for industrial engineers who need reliability, speed, and clarity.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    {features.map((f, i) => (
                        <div key={f.title} className="gradient-border" style={{
                            background: 'rgba(17, 24, 39, 0.7)',
                            borderRadius: 16,
                            padding: 28,
                            transition: 'all 0.3s ease',
                            animationDelay: `${i * 80}ms`,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(17,24,39,0.95)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(17,24,39,0.7)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: `1px solid ${f.color}30` }}>
                                <f.icon size={22} color={f.color} />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#f9fafb' }}>{f.title}</h3>
                            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: 700, margin: '0 auto', background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 24, padding: '64px 40px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                            Ready to take control<br />of your operations?
                        </h2>
                        <p style={{ fontSize: 16, color: '#9ca3af', marginBottom: 36 }}>Join operators using R.I.G.S. to monitor, alert, and command industrial machines in real time.</p>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: 15, padding: '12px 28px' }}>
                                Create Free Account
                            </Link>
                            <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 15, padding: '12px 28px' }}>
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', borderRadius: 8, padding: 5 }}>
                        <Zap size={14} color="white" />
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 14 }}>R.I.G.S.</span>
                </div>
                <p style={{ fontSize: 13, color: '#4b5563' }}>© 2026 Remote Industrial Governance System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
