import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                // Must ensure axios sends cookies so the session is read
                const res = await api.get('/auth/oauth2/success', { withCredentials: true });
                if (res.data?.token) {
                    const userData = res.data;
                    localStorage.setItem('token', userData.token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    // Force reload to apply auth context
                    window.location.href = '/app/dashboard';
                }
            } catch (err) {
                console.error('OAuth2 login exchange failed:', err);
                setError('Failed to securely exchange authentication token. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        fetchToken();
    }, [navigate]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#030712', color: 'white' }}>
            <Zap size={40} className="animate-pulse text-sky-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Securing your session...</h2>
            {error ? (
                <p className="text-red-400">{error}</p>
            ) : (
                <p className="text-gray-400 text-sm">Please wait while we finalize your login.</p>
            )}
        </div>
    );
};

export default OAuthCallback;
