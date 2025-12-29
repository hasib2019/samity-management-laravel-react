import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedMenus = localStorage.getItem('menus');
        
        if (storedMenus) {
            setMenus(JSON.parse(storedMenus));
        }

        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/me');
            setUser(response.data.user);
            setMenus(response.data.menus);
            localStorage.setItem('menus', JSON.stringify(response.data.menus));
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('menus');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('menus', JSON.stringify(response.data.menus));
        setUser(response.data.user);
        setMenus(response.data.menus);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('menus');
            setUser(null);
            setMenus([]);
        }
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.roles.some(role => role.slug === 'super-admin')) return true;
        
        return user.roles.some(role => 
            role.permissions.some(p => p.slug === permission)
        );
    };

    return (
        <AuthContext.Provider value={{ user, menus, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
