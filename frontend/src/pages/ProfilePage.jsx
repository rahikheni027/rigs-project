import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, Lock, Zap, Calendar, Clock, Camera, Eye, EyeOff, Save } from 'lucide-react';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editName, setEditName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const { showToast } = useToast();

    // Password change state
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const [savingPw, setSavingPw] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const r = await api.get('/profile');
                setProfile(r.data);
                setEditName(r.data.name || '');
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
    }, []);

    const handleSaveName = async () => {
        if (!editName.trim() || editName.trim() === profile?.name) return;
        setSavingName(true);
        try {
            await api.put(`/profile/update-name?name=${encodeURIComponent(editName.trim())}`);
            setProfile(p => ({ ...p, name: editName.trim() }));
            // Update localStorage too
            const saved = JSON.parse(localStorage.getItem('user') || '{}');
            saved.name = editName.trim();
            localStorage.setItem('user', JSON.stringify(saved));
            showToast('Name updated successfully', 'success');
        } catch (e) {
            showToast('Failed to update name', 'error');
        } finally { setSavingName(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPw !== pwForm.confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (pwForm.newPw.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setSavingPw(true);
        try {
            await api.put('/profile/password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.newPw,
            });
            setPwForm({ current: '', newPw: '', confirm: '' });
            showToast('Password changed successfully', 'success');
        } catch (e) {
            const msg = e.response?.data?.message || 'Failed to change password';
            showToast(msg, 'error');
        } finally { setSavingPw(false); }
    };

    const handle2FAToggle = async () => {
        try {
            await api.post('/profile/toggle-2fa');
            setProfile(p => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }));
            showToast(profile?.twoFactorEnabled ? '2FA disabled' : '2FA enabled', 'success');
        } catch (e) {
            showToast('Failed to toggle 2FA', 'error');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} color="#38bdf8" />
            </div>
        </div>
    );

    const initials = profile?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const isGoogleUser = profile?.provider === 'GOOGLE' || (!profile?.password && profile?.profileImageUrl?.includes('google'));

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(31,41,55,0.6)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f9fafb',
        fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    };

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
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Role</label>
                                <div style={{ padding: '10px 14px', background: 'rgba(31,41,55,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, color: '#6b7280', fontSize: 14 }}>{profile?.role}</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Email Address</label>
                            <input defaultValue={profile?.email} readOnly style={{ ...inputStyle, background: 'rgba(31,41,55,0.3)', color: '#6b7280', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.05)' }} />
                        </div>
                        <button
                            onClick={handleSaveName}
                            disabled={savingName || editName.trim() === profile?.name}
                            style={{
                                padding: '10px 22px', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white',
                                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(14,165,233,0.3)',
                                opacity: savingName || editName.trim() === profile?.name ? 0.5 : 1,
                                display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.2s',
                            }}
                        >
                            <Save size={15} /> {savingName ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>

                    {/* Security - 2FA */}
                    <div style={{ background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 28 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <Lock size={17} color="#38bdf8" />Security Settings
                        </div>

                        {/* 2FA toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'rgba(31,41,55,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={18} color="#fbbf24" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Two-Factor Authentication</div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Add an extra layer of security to your account.</div>
                                </div>
                            </div>
                            <button
                                onClick={handle2FAToggle}
                                style={{
                                    padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                    ...(profile?.twoFactorEnabled
                                        ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
                                        : { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' })
                                }}
                            >
                                {profile?.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>

                        {/* Password Change Form */}
                        {!isGoogleUser && (
                            <form onSubmit={handleChangePassword}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Lock size={14} color="#6b7280" /> Change Password
                                </div>
                                {['current', 'newPw', 'confirm'].map((field) => {
                                    const labels = { current: 'Current Password', newPw: 'New Password', confirm: 'Confirm New Password' };
                                    return (
                                        <div key={field} style={{ marginBottom: 14 }}>
                                            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                                                {labels[field]}
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPw[field] ? 'text' : 'password'}
                                                    value={pwForm[field]}
                                                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                                                    required
                                                    style={{ ...inputStyle, paddingRight: 42 }}
                                                    onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.5)'}
                                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                                                    style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0 }}
                                                >
                                                    {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    type="submit"
                                    disabled={savingPw}
                                    style={{
                                        padding: '10px 22px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24',
                                        border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                                        opacity: savingPw ? 0.5 : 1, transition: 'opacity 0.2s',
                                    }}
                                >
                                    <Lock size={14} /> {savingPw ? 'Changing…' : 'Change Password'}
                                </button>
                            </form>
                        )}
                        {isGoogleUser && (
                            <div style={{ padding: '14px 16px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 10, fontSize: 12, color: '#6b7280' }}>
                                Password change is not available for Google accounts.
                            </div>
                        )}
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
