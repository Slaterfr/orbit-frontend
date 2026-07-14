import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Key } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguage();

    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Client-side passwords match validation
        if (newPassword !== confirmPassword) {
            setError(t('auth.passwordsMismatch'));
            return;
        }

        if (!token) {
            setError(language === 'en' ? 'Missing recovery token.' : 'Falta el token de recuperación.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, new_password: newPassword })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(parseApiError(data, 'Failed to reset password'));
            }

            setSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
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
                <div className="flex-center mb-4">
                    <Key size={40} color="var(--accent-secondary)" />
                </div>

                <h2 className="text-xl mb-6" style={{ fontWeight: 600, textAlign: 'center' }}>
                    {t('auth.resetPasswordTitle')}
                </h2>

                {error && (
                    <div style={{ color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {success ? (
                    <div style={{ color: 'var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {t('auth.resetPasswordSuccess')}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="text-sm text-secondary">{t('auth.newPassword')}</label>
                            <input
                                type="password"
                                className="input mt-2"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                autoFocus
                            />
                        </div>
                        <div className="mb-6">
                            <label className="text-sm text-secondary">{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                className="input mt-2"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-secondary)' }} disabled={loading}>
                            {loading ? (language === 'en' ? 'Updating...' : 'Actualizando...') : t('auth.resetPasswordBtn')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
