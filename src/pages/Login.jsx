import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { parseJwt } from '../utils';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email); // OAuth2PasswordRequestForm expects 'username' field, usually mapped to email
            formData.append('password', password);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            const decoded = parseJwt(data.access_token);
            const userData = { 
                email: email, 
                id: decoded?.user_id || decoded?.sub,
                role: decoded?.role
            }; 

            login(userData, data.access_token, data.refresh_token);
            navigate('/');
        } catch (err) {
            setError(t('auth.invalidCreds'));
            console.error(err);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                <button 
                    onClick={toggleLanguage} 
                    className="btn btn-ghost" 
                    style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '40px', padding: '8px' }}
                    title={language === 'en' ? "Switch to Spanish" : "Cambiar a Inglés"}
                >
                    {language.toUpperCase()}
                </button>
            </div>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="flex-center mb-4">
                    <LogIn size={40} color="var(--accent-primary)" />
                </div>
                <h2 className="text-xl flex-center mb-4">{t('auth.loginTitle')}</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">{t('auth.email')}</label>
                        <input
                            type="email"
                            className="input mt-2"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">{t('auth.password')}</label>
                        <input
                            type="password"
                            className="input mt-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                {t('auth.forgotPassword')}
                            </Link>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        {t('auth.loginBtn')}
                    </button>
                </form>
                <div className="mt-4 flex-center text-sm">
                    <span className="text-secondary">{t('auth.needAccount').split('?')[0]}?</span>
                    <Link to="/register" style={{ marginLeft: '5px', color: 'var(--accent-primary)' }}>{t('auth.needAccount').split('?')[1].trim()}</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
