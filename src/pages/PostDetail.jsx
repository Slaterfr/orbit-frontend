import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const CommentItem = ({ comment, onReply, onVote, onEdit, onDelete, currentUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const { language, t } = useLanguage();
 
    const handleSave = () => {
        if (editContent.trim()) {
            onEdit(comment.id, editContent);
            setIsEditing(false);
        }
    };
 
    const isOwner = currentUser && String(currentUser.id) === String(comment.user_id);
    const isAdmin = currentUser && currentUser.role === 'admin';

    return (
        <div className="card mt-2" style={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', marginLeft: comment.parent_id ? 'var(--comment-indent, 20px)' : '0' }}>
            <div className="flex-between">
                <div className="flex-center gap-2">
                    <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)'
                    }}>
                        {comment.user?.avatar_url ? (
                            <img src={comment.user.avatar_url} alt={`${comment.user.username}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <UserIcon size={12} color="var(--text-secondary)" />
                        )}
                    </div>
                    <Link to={`/users/${comment.user?.username}`} className="text-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {comment.user?.username || `User ${comment.user_id}`}
                    </Link>
                </div>
                <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                    {comment.updated_at && ` (${t('postDetail.edited')})`}
                </span>
            </div>
 
            {isEditing ? (
                <div className="mt-2">
                    <textarea
                        className="input mb-2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                    />
                    <div className="flex-start gap-2">
                        <button className="btn btn-primary text-xs" style={{ padding: '4px 8px' }} onClick={handleSave}>{t('postDetail.save')}</button>
                        <button className="btn btn-ghost text-xs" style={{ padding: '4px 8px' }} onClick={() => { setIsEditing(false); setEditContent(comment.content); }}>{t('postDetail.cancel')}</button>
                    </div>
                </div>
            ) : (
                <p className="mt-2 text-sm">{comment.content}</p>
            )}

            <div className="flex-between mt-2">
                <div className="flex-start gap-4">
                    <button
                        className="text-secondary text-sm"
                        onClick={() => onVote(comment.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: comment.user_voted ? '#ef4444' : 'inherit'
                        }}
                    >
                        <Heart size={14} fill={comment.user_voted ? '#ef4444' : 'none'} color={comment.user_voted ? '#ef4444' : 'currentColor'} />
                        {comment.vote_count !== undefined 
                            ? `${comment.vote_count} ${comment.vote_count === 1 
                                ? (language === 'en' ? 'Like' : 'Me gusta') 
                                : (language === 'en' ? 'Likes' : 'Me gusta')}` 
                            : (language === 'en' ? 'Like' : 'Me gusta')}
                    </button>
                    {!isEditing && <button className="text-secondary text-sm" onClick={() => onReply(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{t('postDetail.reply')}</button>}
                </div>

                {!isEditing && (isOwner || isAdmin) && (
                    <div className="flex-start gap-2">
                        {(isOwner || isAdmin) && (
                            <button
                                className="text-secondary"
                                onClick={() => setIsEditing(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                        <button
                            className="text-secondary"
                            onClick={() => onDelete(comment.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {comment.replies && comment.replies.map(reply => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onVote={onVote}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
};

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const { token, user } = useAuth();
    const { language, t } = useLanguage();

    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editPostTitle, setEditPostTitle] = useState('');
    const [editPostContent, setEditPostContent] = useState('');

    const fetchPost = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();

                // Fetch vote stats for this post
                try {
                    const statsRes = await fetch(`${API_BASE_URL}/vote/post/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (statsRes.ok) {
                        const stats = await statsRes.json();
                        setPost({ ...data, vote_count: stats.vote_count, user_voted: stats.user_voted });
                        return;
                    }
                } catch (statsErr) {
                    console.error("Failed to fetch post stats", statsErr);
                }
                setPost({ ...data, vote_count: 0, user_voted: false });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();

                // Fetch stats for each comment
                const commentsWithStats = await Promise.all(data.map(async (c) => {
                    try {
                        const statsRes = await fetch(`${API_BASE_URL}/vote/comment/${c.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (statsRes.ok) {
                            const stats = await statsRes.json();
                            return { ...c, vote_count: stats.vote_count, user_voted: stats.user_voted };
                        }
                    } catch (e) {
                        console.error("Failed to fetch comment stats " + c.id, e);
                    }
                    return { ...c, vote_count: 0, user_voted: false };
                }));

                // Organize comments into tree
                const commentMap = {};
                const roots = [];
                commentsWithStats.forEach(c => {
                    commentMap[c.id] = { ...c, replies: [] };
                });
                commentsWithStats.forEach(c => {
                    if (c.parent_id) {
                        if (commentMap[c.parent_id]) {
                            commentMap[c.parent_id].replies.push(commentMap[c.id]);
                        }
                    } else {
                        roots.push(commentMap[c.id]);
                    }
                });
                setComments(roots);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token && id) {
            fetchPost();
            fetchComments();
        }
    }, [id, token]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                content: newComment,
                post_id: id,
                parent_id: replyTo
            };
            const response = await fetch(`${API_BASE_URL}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setNewComment('');
                setReplyTo(null);
                fetchComments();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePostVote = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/vote/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ post_id: id })
            });
            if (response.ok) {
                fetchPost();
            }
        } catch (error) {
            console.error("Vote failed", error);
        }
    };

    const handleUpdatePost = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: editPostTitle, content: editPostContent })
            });
            if (response.ok) {
                setIsEditingPost(false);
                fetchPost();
            }
        } catch (error) {
            console.error("Update post failed", error);
        }
    };

    const handleDeletePost = async () => {
        if (window.confirm(t('postDetail.deleteConfirm'))) {
            try {
                const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    navigate('/');
                }
            } catch (error) {
                console.error("Delete post failed", error);
            }
        }
    };

    const handleEditComment = async (commentId, content) => {
        try {
            const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error("Edit comment failed", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm(t('postDetail.deleteCommentConfirm'))) {
            try {
                const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    fetchComments();
                }
            } catch (error) {
                console.error("Delete comment failed", error);
            }
        }
    };

    if (!post) return <div className="container mt-4">{language === 'en' ? 'Loading...' : 'Cargando...'}</div>;

    return (
        <div className="container" style={{ maxWidth: 800 }}>
            {isEditingPost ? (
                <div className="card mb-4">
                    <form onSubmit={handleUpdatePost}>
                        <input
                            className="input mb-4"
                            placeholder={t('feed.postTitle')}
                            value={editPostTitle}
                            onChange={(e) => setEditPostTitle(e.target.value)}
                            required
                        />
                        <textarea
                            className="input mb-4"
                            placeholder={t('feed.postPlaceholder')}
                            rows={5}
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="btn btn-ghost" type="button" onClick={() => setIsEditingPost(false)}>{t('postDetail.cancel')}</button>
                            <button className="btn btn-primary" type="submit">{t('postDetail.save')}</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="card mb-4">
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
                                    {post.owner?.username || 'Unknown'}
                                </Link>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                    {post.updated_at && ` (${t('postDetail.edited')})`}
                                </div>
                            </div>
                        </div>

                        {user && (String(user.id) === String(post.owner_id) || user.role === 'admin') && (
                            <div className="flex-start gap-2">
                                {(String(user.id) === String(post.owner_id) || user.role === 'admin') && (
                                    <button
                                        className="btn btn-ghost flex-center"
                                        onClick={() => {
                                            setIsEditingPost(true);
                                            setEditPostTitle(post.title);
                                            setEditPostContent(post.content);
                                        }}
                                        style={{ padding: '6px' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                <button
                                    className="btn btn-ghost flex-center"
                                    onClick={handleDeletePost}
                                    style={{ padding: '6px', color: 'var(--error)' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>{post.title}</h2>
                    <p className="text-secondary mb-4" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

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
                                style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }} 
                            />
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }} className="flex-start gap-4">
                        <button
                            className="btn btn-ghost flex-center gap-2"
                            onClick={handlePostVote}
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
                    </div>
                </div>
            )}

            <div className="card">
                <h3 className="text-lg mb-4">{t('postDetail.commentsSection')}</h3>
 
                <form onSubmit={handleSubmitComment} className="mb-4">
                    {replyTo && (
                        <div className="text-sm text-secondary mb-2">
                            {t('postDetail.replyingTo')} #{replyTo}{' '}
                            <button type="button" onClick={() => setReplyTo(null)} style={{ color: 'var(--accent-secondary)' }}>
                                {t('postDetail.cancel')}
                            </button>
                        </div>
                    )}
                    <div className="flex-start gap-2">
                        <input
                            className="input"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('postDetail.addComment')}
                            required
                        />
                        <button type="submit" className="btn btn-primary">{t('postDetail.commentBtn')}</button>
                    </div>
                </form>

                <div>
                    {comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={(id) => setReplyTo(id)}
                            onVote={async (cid) => {
                                const response = await fetch(`${API_BASE_URL}/vote/comment`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ comment_id: cid })
                                });
                                if (response.ok) {
                                    fetchComments();
                                }
                            }}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                            currentUser={user}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
