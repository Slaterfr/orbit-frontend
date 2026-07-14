import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        bio: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(parseApiError(data, 'Registration failed'));
            }

            navigate('/login');
        } catch (err) {
            setError(err.message);
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
                    <UserPlus size={40} color="var(--accent-secondary)" />
                </div>
                <h2 className="text-xl flex-center mb-4">{t('auth.registerTitle')}</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">{t('auth.username')}</label>
                        <input
                            type="text"
                            className="input mt-2"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">{t('auth.email')}</label>
                        <input
                            type="email"
                            className="input mt-2"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">{t('auth.password')}</label>
                        <input
                            type="password"
                            className="input mt-2"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">{t('auth.bio')}</label>
                        <textarea
                            className="input mt-2"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-secondary)' }}>
                        {t('auth.registerBtn')}
                    </button>
                </form>
                <div className="mt-4 flex-center text-sm">
                    <span className="text-secondary">{t('auth.haveAccount').split('?')[0]}?</span>
                    <Link to="/login" style={{ marginLeft: '5px', color: 'var(--accent-primary)' }}>{t('auth.haveAccount').split('?')[1].trim()}</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
