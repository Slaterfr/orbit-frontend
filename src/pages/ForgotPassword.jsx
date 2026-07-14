import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, lang: language })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(parseApiError(data, 'Failed to send recovery email'));
            }

            setSuccess(true);
            setEmail('');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
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
                <button 
                    onClick={() => navigate('/login')} 
                    className="btn btn-ghost mb-4" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: 0, fontSize: '0.9rem' }}
                >
                    <ArrowLeft size={16} />
                    {t('avatar.back')}
                </button>

                <div className="flex-center mb-4">
                    <Mail size={40} color="var(--accent-primary)" />
                </div>

                <h2 className="text-xl mb-2" style={{ fontWeight: 600, textAlign: 'center' }}>
                    {t('auth.forgotPasswordTitle')}
                </h2>
                <p className="text-sm text-secondary mb-6" style={{ textAlign: 'center', lineHeight: 1.5 }}>
                    {t('auth.forgotPasswordDesc')}
                </p>

                {error && (
                    <div style={{ color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {success ? (
                    <div style={{ color: 'var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {t('auth.forgotPasswordSuccess')}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="text-sm text-secondary">{t('auth.email')}</label>
                            <input
                                type="email"
                                className="input mt-2"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? (language === 'en' ? 'Sending...' : 'Enviando...') : t('auth.forgotPasswordBtn')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
