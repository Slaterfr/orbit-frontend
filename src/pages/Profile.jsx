import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, UserPlus, UserMinus, UserCheck, UserX, Heart, MessageSquare, Edit2, Palette, Shield } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { parseApiError } from '../utils/errorParser';
import { themes } from '../utils/themes';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [friendship, setFriendship] = useState(null);
    const [friends, setFriends] = useState([]);
    const [posts, setPosts] = useState([]);
    const [notFound, setNotFound] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editBioText, setEditBioText] = useState('');
    const [bioError, setBioError] = useState('');
    const [isSelectingTheme, setIsSelectingTheme] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [sendToAll, setSendToAll] = useState(true);
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [broadcastError, setBroadcastError] = useState('');
    const [broadcastSuccess, setBroadcastSuccess] = useState('');
    const { token, user, refreshUser } = useAuth();
    const { language, t } = useLanguage();
    const { showToast } = useToast();

    const isCurrentUser = user && (
        username === 'me' || 
        (profile && user.id === profile.id) || 
        (user.username && username && user.username.toLowerCase() === username.toLowerCase())
    );

    const fetchFriendsList = async (targetId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/friends/${targetId}/profiles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (e) {
            console.error("Failed to fetch friends list", e);
        }
    };

    const fetchFriendshipStatus = async (targetId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/status/${targetId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriendship(data);
            }
        } catch (e) {
            console.error("Failed to fetch friendship status", e);
        }
    };

    const fetchUserPosts = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/?user_id=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const postsData = await response.json();
                
                // Fetch stats (likes/user_voted) for each post
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
        } catch (e) {
            console.error("Failed to fetch user posts", e);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setNotFound(false);
            setProfile(null);
            try {
                const url = username === 'me' 
                    ? `${API_BASE_URL}/users/me` 
                    : `${API_BASE_URL}/users/profile/${username}`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    let data = await response.json();
                    if (Array.isArray(data)) {
                        const exactMatch = data.find(u => u.username.toLowerCase() === username.toLowerCase());
                        data = exactMatch || data[0];
                    }
                    if (data) {
                        setProfile(data);
                        fetchFriendsList(data.id);
                        fetchUserPosts(data.id);
                        if (user && data.id !== user.id) {
                            fetchFriendshipStatus(data.id);
                        }
                    } else {
                        setNotFound(true);
                    }
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                console.error(e);
                setNotFound(true);
            }
        };
        if (username && token) fetchProfile();
    }, [username, token, user]);

    useEffect(() => {
        if (profile) {
            const currentThemeIndex = profile.theme_preference || 0;
            const theme = themes[currentThemeIndex] || themes[0];
            document.body.style.background = theme.gradient;
            document.body.style.backgroundAttachment = 'fixed';
        }
        return () => {
            document.body.style.background = '';
            document.body.style.backgroundAttachment = '';
        };
    }, [profile]);

    const handleSendRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ requested_id: profile.id })
            });
            if (response.ok) {
                fetchFriendshipStatus(profile.id);
            }
        } catch (e) {
            console.error("Failed to send friend request", e);
        }
    };

    const handleCancelRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/${friendship.id}/cancel`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setFriendship(null);
            }
        } catch (e) {
            console.error("Failed to cancel friend request", e);
        }
    };

    const handleAcceptRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/${friendship.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'accepted' })
            });
            if (response.ok) {
                fetchFriendshipStatus(profile.id);
                fetchFriendsList(profile.id);
            }
        } catch (e) {
            console.error("Failed to accept friend request", e);
        }
    };

    const handleRejectRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/${friendship.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (response.ok) {
                setFriendship(null);
            }
        } catch (e) {
            console.error("Failed to reject friend request", e);
        }
    };

    const handleUnfriend = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/${friendship.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setFriendship(null);
                fetchFriendsList(profile.id);
            }
        } catch (e) {
            console.error("Failed to unfriend", e);
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
                fetchUserPosts(profile.id);
            }
        } catch (error) {
            console.error("Vote failed", error);
        }
    };

    useEffect(() => {
        if (profile) {
            setEditBioText(profile.bio || '');
        }
    }, [profile]);

    const handleSaveBio = async () => {
        setBioError('');
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bio: editBioText })
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setProfile({ ...profile, bio: updatedUser.bio });
                setIsEditingBio(false);
                if (refreshUser) {
                    refreshUser();
                }
            } else {
                const data = await response.json();
                setBioError(parseApiError(data, 'Failed to save bio'));
            }
        } catch (e) {
            console.error("Error saving bio", e);
            setBioError(e.message || 'Error saving bio');
        }
    };

    const handleSelectTheme = async (themeId) => {
        setProfile(prev => ({ ...prev, theme_preference: themeId }));
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ theme_preference: themeId })
            });
            if (response.ok) {
                if (refreshUser) {
                    refreshUser();
                }
            } else {
                console.error("Failed to persist theme preference");
            }
        } catch (e) {
            console.error("Error updating profile theme", e);
        }
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        setBroadcastError('');
        setBroadcastSuccess('');
        
        if (broadcastSubject.trim().length < 3) {
            setBroadcastError(language === 'en' ? 'Subject must be at least 3 characters.' : 'El asunto debe tener al menos 3 caracteres.');
            return;
        }
        if (broadcastBody.trim().length < 10) {
            setBroadcastError(language === 'en' ? 'Body content must be at least 10 characters.' : 'El contenido del cuerpo debe tener al menos 10 caracteres.');
            return;
        }

        setBroadcastLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/admin/broadcast-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: broadcastSubject.trim(),
                    body: broadcastBody.trim(),
                    test_email: sendToAll ? null : testEmail.trim() || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                setBroadcastSuccess(data.message || (language === 'en' ? 'Emails successfully queued!' : '¡Correos en cola con éxito!'));
                setBroadcastSubject('');
                setBroadcastBody('');
                setTestEmail('');
                showToast(language === 'en' ? 'Broadcast sent!' : '¡Anuncio enviado!');
                setTimeout(() => {
                    setShowBroadcastModal(false);
                    setBroadcastSuccess('');
                }, 2000);
            } else {
                const errData = await response.json();
                setBroadcastError(parseApiError(errData, 'Failed to send broadcast'));
            }
        } catch (err) {
            setBroadcastError(language === 'en' ? 'Network error occurred.' : 'Ocurrió un error de red.');
        } finally {
            setBroadcastLoading(false);
        }
    };

    if (notFound) {
        return (
            <div className="container mt-4" style={{ maxWidth: 600 }}>
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>{t('profile.notFound')}</h2>
                    <p className="text-secondary mb-6">{language === 'en' ? `The user "${username}" does not exist in Orbit.` : `El usuario "${username}" no existe en Orbit.`}</p>
                    <Link to="/" className="btn btn-primary">{t('profile.backHome')}</Link>
                </div>
            </div>
        );
    }

    if (!profile) return <div className="container mt-4">{language === 'en' ? 'Loading...' : 'Cargando...'}</div>;

    const renderFriendshipButton = () => {
        if (isCurrentUser) return null;
 
        if (!friendship) {
            return (
                <button className="btn btn-primary flex-center gap-2" onClick={handleSendRequest}>
                    <UserPlus size={18} />
                    <span>{t('profile.status.none')}</span>
                </button>
            );
        }
 
        if (friendship.status === 'pending') {
            if (friendship.requestor_id === user.id) {
                return (
                    <button className="btn flex-center gap-2" style={{ backgroundColor: 'var(--error)', color: 'white' }} onClick={handleCancelRequest}>
                        <UserMinus size={18} />
                        <span>{t('profile.cancelRequest')}</span>
                    </button>
                );
            } else {
                return (
                    <div className="flex-center gap-2">
                        <button className="btn btn-primary flex-center gap-2" onClick={handleAcceptRequest}>
                            <UserCheck size={18} />
                            <span>{t('navbar.accept')}</span>
                        </button>
                        <button className="btn flex-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={handleRejectRequest}>
                            <UserX size={18} />
                            <span>{t('navbar.decline')}</span>
                        </button>
                    </div>
                );
            }
        }
 
        if (friendship.status === 'accepted') {
            return (
                <button className="btn flex-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={handleUnfriend}>
                    <UserMinus size={18} />
                    <span>{t('profile.unfriend')}</span>
                </button>
            );
        }
 
        if (friendship.status === 'blocked') {
            return <div className="text-secondary text-sm font-semibold">{language === 'en' ? 'User Blocked' : 'Usuario Bloqueado'}</div>;
        }
 
        return null;
    };

    const currentThemeIndex = profile?.theme_preference || 0;
    const currentTheme = themes[currentThemeIndex] || themes[0];

    const cardStyle = {
        backgroundColor: 'rgba(24, 24, 27, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
    };

    return (
        <div className="container mt-4" style={{ maxWidth: 600 }}>
            <div className="card flex-center profile-card" style={{ 
                flexDirection: 'column', 
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden',
                paddingTop: '100px',
                ...cardStyle
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '140px',
                    background: currentTheme.gradient,
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', width: 100, height: 100, zIndex: 1, marginTop: '-50px' }}>
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '4px solid var(--card-bg, var(--bg-secondary))',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}>
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <UserIcon size={50} color="var(--text-secondary)" />
                        )}
                    </div>
                </div>
                {isCurrentUser && (
                    <Link to="/upload-avatar" className="btn btn-ghost" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', marginTop: '-8px', zIndex: 1 }}>
                        {t('profile.changePic')}
                    </Link>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                    <h2 className="text-xl" style={{ margin: 0 }}>{profile.username}</h2>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {isCurrentUser && (
                            <button
                                onClick={() => setIsSelectingTheme(!isSelectingTheme)}
                                className="btn btn-ghost"
                                style={{ padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Customize Profile Theme"
                            >
                                <Palette size={18} color={isSelectingTheme ? currentTheme.primary : "var(--text-secondary)"} />
                            </button>
                        )}
                        {isCurrentUser && user && user.role === 'admin' && (
                            <button
                                onClick={() => setShowBroadcastModal(true)}
                                className="btn btn-ghost"
                                style={{ padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={language === 'en' ? "Email Broadcast Console" : "Consola de Envío de Correos"}
                            >
                                <Shield size={18} color="var(--accent-secondary)" />
                            </button>
                        )}
                    </div>
                </div>

                {isCurrentUser && isSelectingTheme && (
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '440px',
                        padding: '16px',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        zIndex: 1,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        margin: '8px 0'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            {language === 'en' ? 'Select Profile Theme' : 'Selecciona el Tema del Perfil'}
                        </h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px',
                            justifyItems: 'center'
                        }}>
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTheme(t.id)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: t.gradient,
                                        border: profile.theme_preference === t.id ? '3px solid var(--text-primary)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                                        transition: 'transform 0.2s',
                                        transform: profile.theme_preference === t.id ? 'scale(1.15)' : 'scale(1)'
                                    }}
                                    title={t.name}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {isEditingBio ? (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
                        <textarea
                            className="textarea"
                            value={editBioText}
                            onChange={(e) => setEditBioText(e.target.value)}
                            placeholder={t('profile.bioPlaceholder')}
                            maxLength={500}
                            style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                        />
                        {bioError && (
                            <div style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'left' }}>
                                {bioError}
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                                className="btn btn-ghost text-sm" 
                                onClick={() => { setIsEditingBio(false); setEditBioText(profile.bio || ''); }}
                                style={{ padding: '4px 8px' }}
                            >
                                {t('profile.cancel')}
                            </button>
                            <button 
                                className="btn btn-primary text-sm" 
                                onClick={handleSaveBio}
                                style={{ padding: '4px 8px' }}
                            >
                                {t('profile.save')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', maxWidth: '100%', padding: '0 1rem' }}>
                        <p className="text-secondary text-center" style={{ maxWidth: 400, margin: 0, wordBreak: 'break-word' }}>
                            {profile.bio || t('profile.noBio')}
                        </p>
                        {isCurrentUser && (
                            <button 
                                onClick={() => setIsEditingBio(true)}
                                className="btn btn-ghost" 
                                style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Bio"
                            >
                                <Edit2 size={14} color="var(--text-secondary)" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-center gap-4 mt-4">
                    <div className="text-center">
                        <div className="text-lg">{friends.length}</div>
                        <div className="text-xs text-secondary">{t('profile.friends')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg">{posts.length}</div>
                        <div className="text-xs text-secondary">{t('profile.posts')}</div>
                    </div>
                </div>
 
                <div className="mt-4 text-xs text-secondary">
                    {t('profile.joined')} {new Date(profile.created_at).toLocaleDateString()}
                </div>
 
                <div className="mt-4">
                    {renderFriendshipButton()}
                </div>
            </div>
 
            {/* Friends Section */}
            <div className="card mt-4" style={{ width: '100%', ...cardStyle }}>
                <h3 className="text-lg mb-4">{t('profile.friends')} ({friends.length})</h3>
                {friends.length === 0 ? (
                    <p className="text-secondary text-sm">{language === 'en' ? 'No friends yet.' : 'Aún no hay amigos.'}</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                        {friends.map(friend => (
                            <Link key={friend.id} to={`/users/${friend.username}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {friend.avatar_url ? (
                                        <img src={friend.avatar_url} alt={`${friend.username}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <UserIcon size={20} color="var(--text-secondary)" />
                                    )}
                                </div>
                                <span className="text-sm" style={{ fontWeight: 500, textAlign: 'center', wordBreak: 'break-all' }}>{friend.username}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Posts Section */}
            <div style={{ marginTop: '2rem', width: '100%' }}>
                <h3 className="text-lg mb-4" style={{ textAlign: 'left' }}>Posts ({posts.length})</h3>
                {posts.length === 0 ? (
                    <p className="text-secondary text-sm" style={{ textAlign: 'left' }}>No posts yet.</p>
                ) : (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        {posts.map(post => (
                            <div key={post.id} className="card" style={{ width: '100%', textAlign: 'left', ...cardStyle }}>
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
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt={`${profile.username}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <UserIcon size={16} color="var(--text-secondary)" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm" style={{ fontWeight: 600 }}>
                                                {profile.username}
                                            </div>
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                                {new Date(post.created_at).toLocaleDateString()}
                                                {post.updated_at && ' (edited)'}
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
                                            alt="Post media attachment" 
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
                                                {post.vote_count !== undefined ? `${post.vote_count} Like${post.vote_count !== 1 ? 's' : ''}` : 'Like'}
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
                        ))}
                    </div>
                )}
            </div>

            {/* Admin Email Broadcast Modal */}
            {showBroadcastModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 className="text-xl" style={{ margin: 0, fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            {language === 'en' ? '🛡️ Admin Email Broadcast' : '🛡️ Envío de Correo Administrativo'}
                        </h3>

                        <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {language === 'en' ? 'Subject' : 'Asunto'}
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={language === 'en' ? "Enter email subject" : "Ingrese el asunto del correo"}
                                    value={broadcastSubject}
                                    onChange={(e) => setBroadcastSubject(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {language === 'en' ? 'Message Body' : 'Cuerpo del Mensaje'}
                                </label>
                                <textarea
                                    className="input"
                                    rows={8}
                                    placeholder={language === 'en' ? "Write your announcement body here..." : "Escriba el cuerpo del anuncio aquí..."}
                                    value={broadcastBody}
                                    onChange={(e) => setBroadcastBody(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {language === 'en' ? 'Send Target' : 'Objetivo de Envío'}
                                </label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            checked={sendToAll}
                                            onChange={() => setSendToAll(true)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        {language === 'en' ? 'All Users (Bulk)' : 'Todos los Usuarios (Masivo)'}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            checked={!sendToAll}
                                            onChange={() => setSendToAll(false)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        {language === 'en' ? 'Single Test Email' : 'Correo de Prueba Individual'}
                                    </label>
                                </div>

                                {!sendToAll && (
                                    <input
                                        type="email"
                                        className="input"
                                        style={{ marginTop: '4px' }}
                                        placeholder={language === 'en' ? "test@example.com" : "prueba@correo.com"}
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        required={!sendToAll}
                                    />
                                )}
                            </div>

                            {broadcastError && (
                                <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                                    {broadcastError}
                                </div>
                            )}

                            {broadcastSuccess && (
                                <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {broadcastSuccess}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setShowBroadcastModal(false);
                                        setBroadcastError('');
                                        setBroadcastSuccess('');
                                    }}
                                    disabled={broadcastLoading}
                                >
                                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={broadcastLoading}
                                >
                                    {broadcastLoading 
                                        ? (language === 'en' ? 'Sending...' : 'Enviando...') 
                                        : (language === 'en' ? 'Send Broadcast' : 'Enviar Anuncio')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
