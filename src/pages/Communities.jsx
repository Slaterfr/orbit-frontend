import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Users, Plus, X, Loader, Globe, EyeOff, ShieldAlert, ArrowRight, Camera } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { parseApiError } from '../utils/errorParser';

const Communities = () => {
    const [publicCommunities, setPublicCommunities] = useState([]);
    const [myCommunities, setMyCommunities] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlogan, setNewSlogan] = useState('');
    const [newPrivacy, setNewPrivacy] = useState('public');
    const [error, setError] = useState('');

    const { token, user } = useAuth();
    const { language } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch public communities
            const pubResponse = await fetch(`${API_BASE_URL}/communities/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let pubData = [];
            if (pubResponse.ok) {
                pubData = await pubResponse.json();
                setPublicCommunities(pubData);
            }

            // Fetch user's joined communities
            const myResponse = await fetch(`${API_BASE_URL}/communities/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myResponse.ok) {
                const myData = await myResponse.json();
                setMyCommunities(myData);
            }
        } catch (err) {
            console.error("Failed to fetch communities", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAllData();
        }
    }, [token]);

    const handleCreateCommunity = async (e) => {
        e.preventDefault();
        if (newName.trim().length < 3) {
            setError(language === 'en' ? 'Name must be at least 3 characters.' : 'El nombre debe tener al menos 3 caracteres.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/communities/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName.trim(),
                    slogan: newSlogan.trim() || null,
                    privacy: newPrivacy
                })
            });

            if (response.ok) {
                const created = await response.json();
                setNewName('');
                setNewSlogan('');
                setNewPrivacy('public');
                setShowModal(false);
                showToast(language === 'en' ? 'Community created successfully!' : '¡Comunidad creada con éxito!');
                
                // Immediately navigate to the chat room of the new community
                navigate(`/communities/${created.id}`);
            } else {
                const errData = await response.json();
                setError(parseApiError(errData, 'Failed to create community'));
            }
        } catch (err) {
            setError(language === 'en' ? 'Network error occurred.' : 'Ocurrió un error de red.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = async (id, privacy, e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.status === 'approved') {
                    showToast(language === 'en' ? 'Joined successfully!' : '¡Te has unido con éxito!');
                    navigate(`/communities/${id}`);
                } else if (result.status === 'pending') {
                    showToast(language === 'en' ? 'Join request submitted for review!' : '¡Solicitud de ingreso enviada a revisión!');
                    fetchAllData();
                }
            } else {
                showToast(language === 'en' ? 'Failed to join community.' : 'Error al unirse a la comunidad.');
            }
        } catch (err) {
            console.error("Join community error", err);
        }
    };

    const handleLeave = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(language === 'en' ? 'Are you sure you want to leave this community?' : '¿Estás seguro de que deseas salir de esta comunidad?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showToast(language === 'en' ? 'You left the community.' : 'Saliste de la comunidad.');
                fetchAllData();
            } else {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to leave community'));
            }
        } catch (err) {
            console.error("Leave community error", err);
        }
    };

    const getPrivacyIcon = (privacy) => {
        switch (privacy) {
            case 'private':
                return <EyeOff size={16} color="var(--error)" title="Private" />;
            case 'listed':
                return <ShieldAlert size={16} color="#fbbf24" title="Listed (Request to Join)" />;
            case 'public':
            default:
                return <Globe size={16} color="#34d399" title="Public" />;
        }
    };

    const getPrivacyText = (privacy) => {
        if (privacy === 'public') return language === 'en' ? 'Public' : 'Pública';
        if (privacy === 'listed') return language === 'en' ? 'Request to Join' : 'Por Solicitud';
        return language === 'en' ? 'Private' : 'Privada';
    };

    const communitiesList = activeTab === 'all' ? publicCommunities : myCommunities;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* Header banner */}
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
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={28} color="var(--accent-secondary)" />
                        </div>
                        <div>
                            <h2 className="text-xl" style={{ margin: 0, fontWeight: 700 }}>
                                {language === 'en' ? 'Communities' : 'Comunidades'}
                            </h2>
                            <p className="text-secondary text-sm" style={{ margin: '4px 0 0 0' }}>
                                {language === 'en' 
                                    ? 'Join custom real-time chat spaces grouped by interests and topics.' 
                                    : 'Únete a salas de chat temáticas en tiempo real.'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent-secondary)' }}
                    >
                        <Plus size={18} />
                        {language === 'en' ? 'Create Community' : 'Crear Comunidad'}
                    </button>
                </div>
            </div>

            {/* Tab Switches */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button 
                    onClick={() => setActiveTab('all')}
                    className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.875rem', padding: '6px 16px', backgroundColor: activeTab === 'all' ? 'var(--bg-secondary)' : 'transparent', border: activeTab === 'all' ? '1px solid var(--border-color)' : 'none' }}
                >
                    {language === 'en' ? 'Explore Communities' : 'Explorar Comunidades'}
                </button>
                <button 
                    onClick={() => setActiveTab('my')}
                    className={`btn ${activeTab === 'my' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.875rem', padding: '6px 16px', backgroundColor: activeTab === 'my' ? 'var(--bg-secondary)' : 'transparent', border: activeTab === 'my' ? '1px solid var(--border-color)' : 'none' }}
                >
                    {language === 'en' ? 'My Joined Spaces' : 'Mis Grupos'} ({myCommunities.length})
                </button>
            </div>

            {/* Listing spaces */}
            {loading ? (
                <div className="flex-center" style={{ padding: '64px 0' }}>
                    <Loader size={32} className="animate-spin" color="var(--accent-secondary)" />
                </div>
            ) : communitiesList.length === 0 ? (
                <div className="card text-center text-secondary" style={{ padding: '48px' }}>
                    {activeTab === 'all' 
                        ? (language === 'en' ? 'No public spaces discovered yet. Be the first to create one!' : 'Aún no hay comunidades públicas. ¡Crea la primera!')
                        : (language === 'en' ? 'You have not joined any community spaces yet.' : 'Aún no te has unido a ninguna comunidad.')}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {communitiesList.map((space) => {
                        const isMember = space.role_in_community !== null;
                        const isRequested = space.join_request_status === 'pending';

                        return (
                            <div 
                                onClick={() => isMember && navigate(`/communities/${space.id}`)}
                                key={space.id}
                                className="card"
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    padding: '16px 20px',
                                    alignItems: 'center',
                                    transition: isMember ? 'transform 0.2s ease, background-color 0.2s ease' : 'none',
                                    cursor: isMember ? 'pointer' : 'default',
                                    border: isMember ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                                onMouseEnter={(e) => isMember && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                onMouseLeave={(e) => isMember && (e.currentTarget.style.transform = 'translateY(0)')}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-color)',
                                    flexShrink: 0
                                }}>
                                    {space.avatar_url ? (
                                        <img src={space.avatar_url} alt={space.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Users size={22} color="var(--text-secondary)" />
                                    )}
                                </div>

                                {/* Body detail */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {space.name}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {getPrivacyIcon(space.privacy)}
                                            <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                                                {getPrivacyText(space.privacy)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-secondary text-sm" style={{
                                        margin: '0 0 4px 0',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {space.slogan || (language === 'en' ? 'Welcome to our space!' : '¡Bienvenido a nuestro espacio!')}
                                    </p>
                                    <span className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 550 }}>
                                        {space.member_count} {space.member_count === 1 ? (language === 'en' ? 'member' : 'miembro') : (language === 'en' ? 'members' : 'miembros')}
                                    </span>
                                </div>

                                {/* Action button */}
                                <div style={{ flexShrink: 0 }}>
                                    {isMember ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button 
                                                onClick={(e) => handleLeave(space.id, e)}
                                                className="btn btn-ghost"
                                                style={{ fontSize: '0.75rem', padding: '6px 12px', color: 'var(--error)' }}
                                            >
                                                {language === 'en' ? 'Leave' : 'Salir'}
                                            </button>
                                            <button 
                                                className="btn btn-primary flex-center"
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                                    border: '1px solid var(--border-color)'
                                                }}
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    ) : isRequested ? (
                                        <button 
                                            disabled
                                            className="btn btn-ghost"
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '6px 16px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid var(--border-color)',
                                                color: '#fbbf24',
                                                cursor: 'not-allowed'
                                            }}
                                        >
                                            {language === 'en' ? 'Requested' : 'Solicitado'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => handleJoin(space.id, space.privacy, e)}
                                            className="btn btn-primary"
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '6px 16px',
                                                backgroundColor: 'var(--accent-secondary)'
                                            }}
                                        >
                                            {space.privacy === 'listed' 
                                                ? (language === 'en' ? 'Request to Join' : 'Solicitar') 
                                                : (language === 'en' ? 'Join' : 'Unirse')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create community Modal */}
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
                            onClick={() => { setShowModal(false); setNewName(''); setNewSlogan(''); setNewPrivacy('public'); setError(''); }}
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
                            {language === 'en' ? 'Create a Community' : 'Crear una Comunidad'}
                        </h3>
                        <p className="text-sm text-secondary mb-4" style={{ textAlign: 'left' }}>
                            {language === 'en' 
                                ? 'Build a custom space. Select privacy levels to control who can join and review messages.' 
                                : 'Crea un espacio propio. Elige el nivel de privacidad para controlar el acceso.'}
                        </p>
                        
                        <form onSubmit={handleCreateCommunity}>
                            <input 
                                className="input mb-4"
                                placeholder={language === 'en' ? 'Community Name (e.g. Design Enthusiasts)' : 'Nombre de la comunidad (ej. Entusiastas del Diseño)'}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                                autoFocus
                            />
                            <textarea 
                                className="input mb-4"
                                placeholder={language === 'en' ? 'Slogan or short description...' : 'Lema o descripción corta...'}
                                rows={3}
                                value={newSlogan}
                                onChange={(e) => setNewSlogan(e.target.value)}
                            />

                            <div className="mb-4" style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    {language === 'en' ? 'Privacy settings' : 'Configuración de privacidad'}
                                </label>
                                <select 
                                    value={newPrivacy}
                                    onChange={(e) => setNewPrivacy(e.target.value)}
                                    className="input"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="public">{language === 'en' ? 'Public (Anyone can explore and join)' : 'Pública (Cualquiera puede explorar y unirse)'}</option>
                                    <option value="listed">{language === 'en' ? 'Listed (Requires joining approval)' : 'Por Solicitud (Requiere aprobación del moderador)'}</option>
                                    <option value="private">{language === 'en' ? 'Private (Invite-only, hidden from search)' : 'Privada (Solo por invitación, oculta en búsqueda)'}</option>
                                </select>
                            </div>

                            {error && (
                                <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'left' }}>
                                    {error}
                                </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    onClick={() => { setShowModal(false); setNewName(''); setNewSlogan(''); setNewPrivacy('public'); setError(''); }}
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
                                    {submitting ? (language === 'en' ? 'Creating...' : 'Creando...') : (language === 'en' ? 'Create Space' : 'Crear Espacio')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Communities;
