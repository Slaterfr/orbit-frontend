import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';
import { API_BASE_URL } from '../config';
import { Camera, X, Megaphone, ArrowLeft } from 'lucide-react';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState('post');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [createError, setCreateError] = useState('');
    const { token, user } = useAuth();
    const { language, t } = useLanguage();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setCreateError('');
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setCreateError('Please select a valid image file.');
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setCreateError('File size exceeds 5MB limit.');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setUploading(true);
        setCreateError('');

        try {
            let mediaIds = null;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch(`${API_BASE_URL}/posts/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(parseApiError(errData, 'Image upload failed'));
                }

                const uploadData = await uploadRes.json();
                mediaIds = [uploadData.id];
            }

            const response = await fetch(`${API_BASE_URL}/posts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content, published: true, media_ids: mediaIds, type: postType })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(parseApiError(errData, 'Failed to create post'));
            }

            navigate('/');
        } catch (error) {
            setCreateError(error.message || 'Failed to create post');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mt-4" style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl" style={{ margin: 0, fontWeight: 700 }}>
                    {language === 'en' ? 'Create New Post' : 'Crear Nueva Publicación'}
                </h2>
            </div>

            <div className="card">
                <form onSubmit={handleCreatePost}>
                    <input
                        className="input mb-4"
                        placeholder={t('feed.postTitle')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <textarea
                        className="input mb-4"
                        placeholder={t('feed.postPlaceholder')}
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />

                    {previewUrl && (
                        <div style={{ position: 'relative', marginBottom: '16px', display: 'inline-block', maxWidth: '100%' }}>
                            <img src={previewUrl} alt="Post attachment preview" style={{ maxHeight: '250px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
                            <button
                                type="button"
                                onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {createError && (
                        <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '12px' }}>
                            {createError}
                        </div>
                    )}

                    {/* Add toggle for Announcement if Admin */}
                    {user && user.role === 'admin' && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            marginBottom: '16px',
                            backgroundColor: 'rgba(245, 158, 11, 0.05)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(245, 158, 11, 0.15)'
                        }}>
                            <Megaphone size={16} color="#f59e0b" />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {language === 'en' ? 'Post as:' : 'Publicar como:'}
                            </span>
                            <select
                                value={postType}
                                onChange={(e) => setPostType(e.target.value)}
                                className="input"
                                style={{
                                    width: 'auto',
                                    padding: '2px 8px',
                                    fontSize: '0.85rem',
                                    margin: 0,
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-color)',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="post">{language === 'en' ? 'Standard Post' : 'Publicación Estándar'}</option>
                                <option value="announcement">{language === 'en' ? 'Official Announcement' : 'Anuncio Oficial'}</option>
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label htmlFor="post-file-upload-page" className="btn btn-ghost flex-center gap-2" style={{ cursor: 'pointer', padding: '8px 12px' }}>
                            <Camera size={18} />
                            <span style={{ fontSize: '0.875rem' }}>{t('feed.uploadImage')}</span>
                        </label>
                        <input
                            id="post-file-upload-page"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button className="btn btn-primary" type="submit" disabled={uploading}>
                            {uploading ? t('feed.publishing') : t('feed.postBtn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
