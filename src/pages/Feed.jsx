import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Share2, User as UserIcon, Camera, X, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';
import { useToast } from '../context/ToastContext';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [announcements, setAnnouncements] = useState([]);
    const [postType, setPostType] = useState('post');
    const { token, user } = useAuth();
    const { language, t } = useLanguage();
    const { showToast } = useToast();

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

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const postsData = await response.json();

                // Fetch stats for each post to merge vote_count and user_voted
                const postsWithStats = await Promise.all(postsData.map(async (post) => {
                    try {
                        const statsRes = await fetch(`${API_BASE_URL}/vote/post/${post.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (statsRes.ok) {
                            const stats = await statsRes.json();
                            return { ...post, vote_count: stats.vote_count, user_voted: stats.user_voted };
                        }
                    } catch (e) {
                        console.error("Failed to fetch stats for post " + post.id, e);
                    }
                    return { ...post, vote_count: 0, user_voted: false };
                }));

                setPosts(postsWithStats);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/announcements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchAnnouncements();
    }, [token]);

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
                body: JSON.stringify({ ...newPost, published: true, media_ids: mediaIds, type: postType })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(parseApiError(errData, 'Failed to create post'));
            }

            setNewPost({ title: '', content: '' });
            setPostType('post');
            setSelectedFile(null);
            setPreviewUrl('');
            fetchPosts();
            fetchAnnouncements();
        } catch (error) {
            setCreateError(error.message || 'Failed to create post');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleVote = async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/vote/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ post_id: postId })
            });
            if (response.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error("Vote failed", error);
        }
    };

    const announcementsCardStyle = {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    };

    return (
        <div className="feed-layout-container" style={{
            display: 'flex',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
            alignItems: 'flex-start'
        }}>
            {/* Left Column - Communities Sidebar */}
            <div className="communities-sidebar" style={{
                width: '240px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'sticky',
                top: '24px',
                height: 'fit-content'
            }}>
                <div 
                    className="card" 
                    onClick={() => showToast(language === 'en' ? 'Communities feature coming soon!' : '¡La función de comunidades llegará pronto!')}
                    style={{
                        padding: '20px',
                        backgroundColor: 'rgba(24, 24, 27, 0.65)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                >
                    <h3 className="text-lg" style={{ margin: 0, fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        {language === 'en' ? 'Communities' : 'Comunidades'}
                    </h3>
                    <p className="text-secondary text-sm" style={{ margin: '8px 0', lineHeight: '1.4' }}>
                        {language === 'en' 
                            ? 'Discover and join interest groups to connect with others.' 
                            : 'Descubre y únete a grupos de interés para conectar con otros.'}
                    </p>
                    <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#60a5fa',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        alignSelf: 'flex-start'
                    }}>
                        {language === 'en' ? 'Coming Soon' : 'Próximamente'}
                    </span>
                </div>
            </div>

            {/* Middle Column - Main Feed */}
            <div style={{ flex: 1, minWidth: 0, maxWidth: 600 }}>
                {/* Create Post */}
                <div className="card mb-4 hide-mobile">
                <form onSubmit={handleCreatePost}>
                    <input
                        className="input mb-4"
                        placeholder={t('feed.postTitle')}
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        required
                    />
                    <textarea
                        className="input mb-4"
                        placeholder={t('feed.postPlaceholder')}
                        rows={3}
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        required
                    />

                    {previewUrl && (
                        <div style={{ position: 'relative', marginBottom: '16px', display: 'inline-block', maxWidth: '100%' }}>
                            <img src={previewUrl} alt="Post attachment preview" style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
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
                        <label htmlFor="post-file-upload" className="btn btn-ghost flex-center gap-2" style={{ cursor: 'pointer', padding: '8px 12px' }}>
                            <Camera size={18} />
                            <span style={{ fontSize: '0.875rem' }}>{t('feed.uploadImage')}</span>
                        </label>
                        <input
                            id="post-file-upload"
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

            {/* Mobile-Only Latest Announcement Banner */}
            {announcements.length > 0 && (
                <Link 
                    to={`/posts/${announcements[0].id}`}
                    style={{ textDecoration: 'none' }}
                    className="hide-desktop"
                >
                    <div className="card mb-4" style={{
                        padding: '16px',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Megaphone size={16} color="#fbbf24" />
                                <span style={{
                                    fontSize: '0.7rem',
                                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                    color: '#fbbf24',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase'
                                }}>
                                    {language === 'en' ? 'Latest Announcement' : 'Último Anuncio'}
                                </span>
                            </div>
                            <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                                {new Date(announcements[0].created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h4 style={{ margin: '4px 0 0 0', color: '#fbbf24', fontSize: '0.95rem', fontWeight: 700 }}>
                            {announcements[0].title}
                        </h4>
                        <p style={{
                            margin: 0,
                            color: 'var(--text-secondary)',
                            fontSize: '0.825rem',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {announcements[0].content}
                        </p>
                    </div>
                </Link>
            )}

            {/* Posts List */}
            <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', width: '100%' }}>
                {posts.length === 0 ? (
                    <div className="card text-center text-secondary" style={{ padding: '2rem', width: '100%' }}>
                        {t('feed.noPosts')}
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="card" style={{ width: '100%' }}>
                            <div className="flex-between mb-4">
                                <div className="flex-center gap-2">
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'var(--bg-tertiary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {post.owner?.avatar_url ? (
                                            <img src={post.owner.avatar_url} alt={`${post.owner.username}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <UserIcon size={16} color="var(--text-secondary)" />
                                        )}
                                    </div>
                                    <div>
                                        <Link to={`/users/${post.owner?.username}`} className="text-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {post.owner?.username || `User ${post.owner_id}`}
                                        </Link>
                                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                            {new Date(post.created_at).toLocaleDateString()}
                                            {post.updated_at && ` (${t('postDetail.edited')})`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg mb-4">{post.title}</h3>
                            <p className="text-secondary mb-4">{post.content}</p>

                            {post.media_urls && post.media_urls.length > 0 && (
                                <div style={{ 
                                    marginBottom: '16px', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden', 
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img 
                                        src={post.media_urls[0]} 
                                        alt="Post attachment" 
                                        style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} 
                                    />
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }} className="flex-between">
                                <div className="flex-center gap-4">
                                    <button
                                        className="btn btn-ghost flex-center gap-2"
                                        onClick={() => handleVote(post.id)}
                                        style={{ color: post.user_voted ? '#ef4444' : 'inherit' }}
                                    >
                                        <Heart size={18} fill={post.user_voted ? '#ef4444' : 'none'} color={post.user_voted ? '#ef4444' : 'currentColor'} />
                                        <span className="text-sm">
                                            {post.vote_count !== undefined 
                                                ? `${post.vote_count} ${post.vote_count === 1 
                                                    ? (language === 'en' ? 'Like' : 'Me gusta') 
                                                    : (language === 'en' ? 'Likes' : 'Me gusta')}` 
                                                : (language === 'en' ? 'Like' : 'Me gusta')}
                                        </span>
                                    </button>
                                    <Link to={`/posts/${post.id}`} className="btn btn-ghost flex-center gap-2">
                                        <MessageSquare size={18} />
                                        <span className="text-sm">
                                            {post.comment_count !== undefined 
                                                ? `${post.comment_count} ${post.comment_count === 1 
                                                    ? (language === 'en' ? 'Comment' : 'Comentario') 
                                                    : (language === 'en' ? 'Comments' : 'Comentarios')}` 
                                                : (language === 'en' ? 'Comment' : 'Comentario')}
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            </div>

            {/* Announcements Sidebar Panel */}
            <div className="announcements-sidebar" style={{
                width: '320px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'sticky',
                top: '24px',
                height: 'fit-content'
            }}>
                <div className="card" style={{
                    padding: '20px',
                    backgroundColor: 'rgba(24, 24, 27, 0.65)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <Megaphone size={20} color="#f59e0b" />
                        <h3 className="text-lg" style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {language === 'en' ? 'Announcements' : 'Anuncios'}
                        </h3>
                    </div>

                    {announcements.length === 0 ? (
                        <p className="text-secondary text-sm" style={{ textAlign: 'center', margin: '16px 0' }}>
                            {language === 'en' ? 'No active announcements.' : 'No hay anuncios activos.'}
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {announcements.map((ann) => (
                                <Link 
                                    to={`/posts/${ann.id}`} 
                                    key={ann.id}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div 
                                        style={announcementsCardStyle}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                                color: '#fbbf24',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {language === 'en' ? 'Official' : 'Oficial'}
                                            </span>
                                            <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                                                {new Date(ann.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 style={{ margin: '4px 0 0 0', color: '#fbbf24', fontSize: '0.95rem', fontWeight: 600 }}>
                                            {ann.title}
                                        </h4>
                                        <p style={{ 
                                            margin: 0, 
                                            color: 'var(--text-secondary)', 
                                            fontSize: '0.825rem',
                                            lineHeight: '1.4',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {ann.content}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feed;
