import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Share2, User as UserIcon, Camera, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [createError, setCreateError] = useState('');
    const { token, user } = useAuth();
    const { language, t } = useLanguage();

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

    useEffect(() => {
        fetchPosts();
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
                body: JSON.stringify({ ...newPost, published: true, media_ids: mediaIds })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(parseApiError(errData, 'Failed to create post'));
            }

            setNewPost({ title: '', content: '' });
            setSelectedFile(null);
            setPreviewUrl('');
            fetchPosts();
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

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {/* Create Post */}
            <div className="card mb-4">
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
                                        <span className="text-sm">{language === 'en' ? 'Comment' : 'Comentar'}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Feed;
