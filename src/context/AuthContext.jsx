import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const refreshUser = async () => {
        if (token) {
            try {
                const response = await fetch('http://127.0.0.1:8000/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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
                    const response = await fetch('http://127.0.0.1:8000/users/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        // Token is invalid or expired, log out user
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
        <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
