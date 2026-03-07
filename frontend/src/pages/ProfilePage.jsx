import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Mail, Shield, Lock, Zap, Calendar, Clock, Camera } from 'lucide-react';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const r = await api.get('/profile');
                setProfile(r.data);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} color="#38bdf8" />
            </div>
        </div>
    );

    const initials = profile?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#f9fafb', maxWidth: 880, margin: '0 auto' }}>
            {/* Banner */}
            <div style={{ height: 130, borderRadius: 20, marginBottom: 0, background: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(99,102,241,0.12) 50%, rgba(168,85,247,0.1) 100%)', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '50%', left: '60%', transform: 'translate(-50%,-50%)', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(14,165,233,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            </div>

            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 8px', marginTop: -44, marginBottom: 32, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: 88, height: 88, borderRadius: 20, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white', border: '4px solid #030712', boxShadow: '0 0 30px rgba(14,165,233,0.3)', overflow: 'hidden' }}>
                        {profile?.profileImageUrl ? <img src={profile.profileImageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                    </div>
                    <button style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 8, background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                        <Camera size={13} />
                    </button>
                </div>
                <div style={{ paddingBottom: 6 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>{profile?.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}><Mail size={13} />{profile?.email}</div>
                </div>
                <div style={{ marginLeft: 'auto', paddingBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '5px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.07em', background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' }}>{profile?.role}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                {/* Left col */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Account info */}
                    <div style={{ background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 28 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
                            <User size={17} color="#38bdf8" />Account Information
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Full Name</label>
                                <input defaultValue={profile?.name} style={{ width: '100%', padding: '10px 14px', background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f9fafb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Role</label>
                                <div style={{ padding: '10px 14px', background: 'rgba(31,41,55,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, color: '#6b7280', fontSize: 14 }}>{profile?.role}</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Email Address</label>
                            <input defaultValue={profile?.email} readOnly style={{ width: '100%', padding: '10px 14px', background: 'rgba(31,41,55,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, color: '#6b7280', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'not-allowed' }} />
                        </div>
                        <button style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(14,165,233,0.3)' }}>
                            Save Changes
                        </button>
                    </div>

                    {/* Security */}
                    <div style={{ background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 28 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <Lock size={17} color="#38bdf8" />Security Settings
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'rgba(31,41,55,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={18} color="#fbbf24" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Two-Factor Authentication</div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Add an extra layer of security to your account.</div>
                                </div>
                            </div>
                            <button style={{
                                padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                ...(profile?.twoFactorEnabled
                                    ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
                                    : { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' })
                            }}>
                                {profile?.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right col */}
                <div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(12,30,58,0.9) 100%)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 18, padding: 24, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Zap size={17} color="#38bdf8" />
                            <span style={{ fontSize: 15, fontWeight: 800 }}>R.I.G.S. Enterprise</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 22 }}>Remote Industrial Governance — Premium Tier</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { icon: Calendar, label: 'Joined', val: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—' },
                                { icon: Clock, label: 'Last Active', val: profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : '—' },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}><item.icon size={12} />{item.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
