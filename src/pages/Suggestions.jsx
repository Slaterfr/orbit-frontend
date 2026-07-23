import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Lightbulb, ChevronUp, MessageSquare, Plus, X, Loader, User as UserIcon } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { parseApiError } from '../utils/errorParser';

const Suggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [sortBy, setSortBy] = useState('votes'); // 'votes' or 'newest'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [error, setError] = useState('');

    const { token, user } = useAuth();
    const { language } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const sortParam = sortBy === 'votes' ? 'votes' : 'date';
            const response = await fetch(`${API_BASE_URL}/posts/suggestions?sort_by=${sortParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data);
            }
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSuggestions();
        }
    }, [token, sortBy]);

    const handleVote = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
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
                // Refresh list inline
                fetchSuggestions();
            }
        } catch (err) {
            console.error("Vote failed", err);
        }
    };

    const handleStatusChange = async (id, newStatus, e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                showToast(language === 'en' ? 'Status updated successfully!' : '¡Estado actualizado con éxito!');
                fetchSuggestions();
            } else {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to update status'));
            }
        } catch (err) {
            console.error("Status update failed", err);
        }
    };

    const handleSubmitSuggestion = async (e) => {
        e.preventDefault();
        if (newTitle.trim().length < 3 || newContent.trim().length < 5) {
            setError(language === 'en' 
                ? 'Title must be >= 3 chars, content >= 5 chars.' 
                : 'El título debe tener >= 3 caracteres, el contenido >= 5.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/posts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newTitle,
                    content: newContent,
                    published: true,
                    type: 'suggestion'
                })
            });

            if (response.ok) {
                setNewTitle('');
                setNewContent('');
                setShowModal(false);
                showToast(language === 'en' ? 'Suggestion posted!' : '¡Sugerencia publicada!');
                fetchSuggestions();
            } else {
                const errData = await response.json();
                setError(parseApiError(errData, 'Failed to post suggestion'));
            }
        } catch (err) {
            setError(language === 'en' ? 'Network error occurred.' : 'Ocurrió un error de red.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'planned':
                return {
                    bg: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    text: language === 'en' ? 'Planned' : 'Planificado'
                };
            case 'completed':
                return {
                    bg: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    text: language === 'en' ? 'Completed' : 'Completado'
                };
            case 'under_review':
            default:
                return {
                    bg: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    text: language === 'en' ? 'Under Review' : 'En Revisión'
                };
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* Header section */}
            <div className="card mb-4" style={{
                padding: '24px',
                backgroundColor: 'rgba(24, 24, 27, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            backgroundColor: 'rgba(236, 72, 153, 0.15)',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Lightbulb size={28} color="var(--accent-secondary)" />
                        </div>
                        <div>
                            <h2 className="text-xl" style={{ margin: 0, fontWeight: 700 }}>
                                {language === 'en' ? 'Suggestions Board' : 'Buzón de Sugerencias'}
                            </h2>
                            <p className="text-secondary text-sm" style={{ margin: '4px 0 0 0' }}>
                                {language === 'en' 
                                    ? 'Help us shape Orbit. Post feature ideas, upvote others, and check progress.' 
                                    : 'Ayúdanos a mejorar Orbit. Propón ideas, vota por otras y mira los avances.'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent-secondary)' }}
                    >
                        <Plus size={18} />
                        {language === 'en' ? 'Suggest a Feature' : 'Proponer una Idea'}
                    </button>
                </div>
            </div>

            {/* Sorting Filters */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <button 
                    onClick={() => setSortBy('votes')}
                    className={`btn ${sortBy === 'votes' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.875rem', padding: '6px 16px', backgroundColor: sortBy === 'votes' ? 'var(--bg-secondary)' : 'transparent', border: sortBy === 'votes' ? '1px solid var(--border-color)' : 'none' }}
                >
                    {language === 'en' ? 'Top Voted' : 'Más Votadas'}
                </button>
                <button 
                    onClick={() => setSortBy('newest')}
                    className={`btn ${sortBy === 'newest' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.875rem', padding: '6px 16px', backgroundColor: sortBy === 'newest' ? 'var(--bg-secondary)' : 'transparent', border: sortBy === 'newest' ? '1px solid var(--border-color)' : 'none' }}
                >
                    {language === 'en' ? 'Newest' : 'Más Recientes'}
                </button>
            </div>

            {/* Suggestion list */}
            {loading ? (
                <div className="flex-center" style={{ padding: '64px 0' }}>
                    <Loader size={32} className="animate-spin" color="var(--accent-secondary)" />
                </div>
            ) : suggestions.length === 0 ? (
                <div className="card text-center text-secondary" style={{ padding: '48px' }}>
                    {language === 'en' ? 'No suggestions posted yet. Be the first!' : 'Aún no hay sugerencias. ¡Sé el primero!'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {suggestions.map((suggestion) => {
                        const statusInfo = getStatusStyles(suggestion.status);
                        const isVoted = suggestion.user_voted;
                        return (
                            <Link 
                                to={`/posts/${suggestion.id}`}
                                key={suggestion.id}
                                className="card"
                                style={{
                                    textDecoration: 'none',
                                    display: 'flex',
                                    gap: '16px',
                                    padding: '20px',
                                    alignItems: 'flex-start',
                                    transition: 'transform 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Vote box */}
                                <button
                                    onClick={(e) => handleVote(suggestion.id, e)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: isVoted ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-tertiary)',
                                        border: isVoted ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        color: isVoted ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                                        transition: 'all 0.2s ease',
                                        minWidth: '48px'
                                    }}
                                >
                                    <ChevronUp size={20} />
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                        {suggestion.vote_count || 0}
                                    </span>
                                </button>

                                {/* Suggestion Main Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {/* Status Badge */}
                                        <span style={{
                                            fontSize: '0.75rem',
                                            backgroundColor: statusInfo.bg,
                                            color: statusInfo.color,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontWeight: 600
                                        }}>
                                            {statusInfo.text}
                                        </span>

                                        {/* Author profile and Date */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: 'var(--bg-tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                {suggestion.owner?.avatar_url ? (
                                                    <img src={suggestion.owner.avatar_url} alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <UserIcon size={10} color="var(--text-secondary)" />
                                                )}
                                            </div>
                                            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                                {suggestion.owner?.username} • {new Date(suggestion.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {suggestion.title}
                                    </h3>
                                    <p className="text-secondary" style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {suggestion.content}
                                    </p>

                                    {/* Footer details */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            <MessageSquare size={16} />
                                            <span>
                                                {suggestion.comment_count !== undefined 
                                                    ? `${suggestion.comment_count} ${suggestion.comment_count === 1 
                                                        ? (language === 'en' ? 'Comment' : 'Comentario') 
                                                        : (language === 'en' ? 'Comments' : 'Comentarios')}` 
                                                    : (language === 'en' ? 'Comment' : 'Comentario')}
                                            </span>
                                        </div>

                                        {/* Inline Admin status selector controls */}
                                        {user && user.role === 'admin' && (
                                            <div 
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            >
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status:</span>
                                                <select
                                                    value={suggestion.status || 'under_review'}
                                                    onChange={(e) => handleStatusChange(suggestion.id, e.target.value, e)}
                                                    className="input"
                                                    style={{
                                                        width: 'auto',
                                                        padding: '2px 8px',
                                                        fontSize: '0.75rem',
                                                        margin: 0,
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        borderColor: 'var(--border-color)',
                                                        cursor: 'pointer',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    <option value="under_review">{language === 'en' ? 'Under Review' : 'En Revisión'}</option>
                                                    <option value="planned">{language === 'en' ? 'Planned' : 'Planificado'}</option>
                                                    <option value="completed">{language === 'en' ? 'Completed' : 'Completado'}</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Creation Modal dialog overlay */}
            {showModal && (
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
                    <div className="card" style={{ width: '90%', maxWidth: '500px', position: 'relative', padding: '24px' }}>
                        <button 
                            onClick={() => { setShowModal(false); setNewTitle(''); setNewContent(''); setError(''); }}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg mb-2" style={{ fontWeight: 600, textAlign: 'left' }}>
                            {language === 'en' ? 'New Suggestion' : 'Nueva Sugerencia'}
                        </h3>
                        <p className="text-sm text-secondary mb-4" style={{ textAlign: 'left' }}>
                            {language === 'en' 
                                ? 'Describe your suggestion clearly. Explain the problem it solves and what you propose.' 
                                : 'Describe tu sugerencia claramente. Explica el problema que resuelve y qué propones.'}
                        </p>
                        
                        <form onSubmit={handleSubmitSuggestion}>
                            <input 
                                className="input mb-4"
                                placeholder={language === 'en' ? 'Idea Title (e.g. Dark Mode customization)' : 'Título de la idea (ej. Personalización de modo oscuro)'}
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                                autoFocus
                            />
                            <textarea 
                                className="input mb-4"
                                placeholder={language === 'en' ? 'Describe your suggestion in detail...' : 'Describe tu sugerencia en detalle...'}
                                rows={5}
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                required
                            />

                            {error && (
                                <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'left' }}>
                                    {error}
                                </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    onClick={() => { setShowModal(false); setNewTitle(''); setNewContent(''); setError(''); }}
                                    disabled={submitting}
                                >
                                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    style={{ backgroundColor: 'var(--accent-secondary)' }}
                                    disabled={submitting}
                                >
                                    {submitting ? (language === 'en' ? 'Posting...' : 'Publicando...') : (language === 'en' ? 'Submit Idea' : 'Enviar Idea')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suggestions;
