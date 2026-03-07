import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for OAuth callback params
        const params = new URLSearchParams(window.location.search);
        const oauthToken = params.get('token');

        if (oauthToken) {
            // OAuth success — save token and user data
            const userData = {
                id: params.get('id'),
                name: params.get('name'),
                email: params.get('email'),
                roles: [`ROLE_${params.get('role') || 'WORKER'}`],
            };
            localStorage.setItem('token', oauthToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/signin', { email, password });
        const { token, ...userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
