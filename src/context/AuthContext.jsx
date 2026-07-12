import { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const login = (userData, authToken, refreshToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    };

    const refreshAccessToken = async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: storedRefreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.access_token);
                localStorage.setItem('token', data.access_token);
                if (data.refresh_token) {
                    localStorage.setItem('refreshToken', data.refresh_token);
                }
                return data.access_token;
            }
        } catch (e) {
            console.error("Failed to refresh access token", e);
        }
        return null;
    };

    const refreshUser = async () => {
        if (token) {
            try {
                let response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status === 401) {
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        response = await fetch(`${API_BASE_URL}/users/me`, {
                            headers: { 'Authorization': `Bearer ${newToken}` }
                        });
                    }
                }

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                }
            } catch (e) {
                console.error("Failed to refresh user", e);
            }
        }
    };
 
    useEffect(() => {
        const verifyTokenOnMount = async () => {
            if (token) {
                try {
                    let response = await fetch(`${API_BASE_URL}/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.status === 401) {
                        const newToken = await refreshAccessToken();
                        if (newToken) {
                            response = await fetch(`${API_BASE_URL}/users/me`, {
                                headers: { 'Authorization': `Bearer ${newToken}` }
                            });
                        }
                    }

                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        logout();
                    }
                } catch (e) {
                    console.error("Failed to verify token on mount:", e);
                    logout();
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        verifyTokenOnMount();
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser, refreshAccessToken }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
