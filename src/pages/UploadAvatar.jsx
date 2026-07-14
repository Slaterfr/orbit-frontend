import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, X, ArrowLeft, Camera } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';

const UploadAvatar = () => {
    const { token, user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        setError('');
        setSuccess(false);
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            setError(language === 'en' ? 'Please select a valid image file.' : 'Por favor selecciona un archivo de imagen válido.');
            return;
        }
 
        // Limit size to 5MB
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setError(language === 'en' ? 'File size exceeds the 5MB limit. Please choose a smaller image.' : 'El tamaño supera el límite de 5MB. Por favor elige una imagen más pequeña.');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError(language === 'en' ? 'Please select an image first.' : 'Por favor selecciona una imagen primero.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(parseApiError(data, 'Failed to upload profile picture'));
            }

            setSuccess(true);
            await refreshUser(); // Update Auth Context user data and localStorage with new avatar URL
            
            setTimeout(() => {
                navigate(`/users/${user?.username || 'me'}`);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setPreviewUrl(user?.avatar_url || '');
        setError('');
        setSuccess(false);
    };

    return (
        <div style={{ maxWidth: '500px', margin: '40px auto' }}>
            <button 
                onClick={() => navigate(-1)} 
                className="btn btn-ghost mb-4" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: 0 }}
            >
                <ArrowLeft size={16} />
                {t('avatar.back')}
            </button>
 
            <div className="card">
                <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>{t('avatar.title')}</h2>
                <p className="text-sm text-secondary mb-6">{language === 'en' ? 'Upload a profile picture. JPG, PNG or WebP, up to 5MB. Files are validated and stored securely.' : 'Sube una foto de perfil. JPG, PNG o WebP, hasta 5MB. Los archivos son validados y guardados de forma segura.'}</p>
 
                {error && (
                    <div style={{ color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
 
                {success && (
                    <div style={{ color: 'var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', textAlign: 'center' }}>
                        {language === 'en' ? 'Profile picture updated successfully! Redirecting...' : '¡Foto de perfil actualizada con éxito! Redirigiendo...'}
                    </div>
                )}

                <form onSubmit={handleUpload} className="flex-center" style={{ flexDirection: 'column' }}>
                    {/* Circle Image Preview Container */}
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <div style={{ 
                            width: '150px', 
                            height: '150px', 
                            borderRadius: '50%', 
                            border: '3px solid var(--border-color)', 
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-secondary)',
                            position: 'relative'
                        }}>
                            {previewUrl ? (
                                <img 
                                    src={previewUrl} 
                                    alt="Avatar Preview" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            ) : (
                                <Camera size={48} className="text-secondary" />
                            )}
                        </div>

                        {selectedFile && (
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ width: '100%', marginBottom: '20px' }}>
                        <label 
                            htmlFor="file-upload" 
                            className="btn btn-ghost" 
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                border: '1px dashed var(--border-color)',
                                padding: '20px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-secondary)'
                            }}
                        >
                            <Upload size={18} />
                            <span>
                                {selectedFile 
                                    ? (language === 'en' ? 'Select a different image' : 'Seleccionar otra imagen') 
                                    : (language === 'en' ? 'Choose an image file' : 'Elegir archivo de imagen')}
                            </span>
                        </label>
                        <input 
                            id="file-upload" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            style={{ display: 'none' }}
                        />
                    </div>
 
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading || !selectedFile}
                        style={{ width: '100%' }}
                    >
                        {loading ? t('avatar.uploading') : t('avatar.uploadBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadAvatar;
