import { Link, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, Bell, Check, X, Search, Lightbulb, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const { logout, user, token } = useAuth();
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguage();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const [showLookup, setShowLookup] = useState(false);
    const [lookupUsername, setLookupUsername] = useState('');
    const [lookupError, setLookupError] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            // Polling every 15 seconds to simulate real-time updates
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRespondRequest = async (friendshipId, statusValue) => {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/${friendshipId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: statusValue })
            });
            if (response.ok) {
                fetchNotifications();
            }
        } catch (e) {
            console.error("Failed to respond to friendship request", e);
        }
    };

    const handleLookupSubmit = async (e) => {
        e.preventDefault();
        setLookupError('');
        setSearchResults([]);
        setSearchPerformed(false);
        const username = lookupUsername.trim();
        if (!username) return;

        setLookupLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/profile/${username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
                setSearchPerformed(true);
                if (data.length === 0) {
                    setLookupError(`No users found matching "${username}".`);
                }
            } else {
                setLookupError('Failed to search users.');
            }
        } catch (err) {
            setLookupError('An error occurred during search.');
            console.error(err);
        } finally {
            setLookupLoading(false);
        }
    };

    return (
        <nav style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '12px 0',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container flex-between" style={{ position: 'relative' }}>
                <Link to="/" className="text-xl" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <img src="/logo.png" alt="Orbit Logo" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                    Orbit
                </Link>

                <div className="flex-center gap-4">
                    {/* User Lookup Trigger Button */}
                    {token && (
                        <button 
                            className="btn btn-ghost flex-center gap-2" 
                            onClick={() => setShowLookup(true)}
                            style={{ padding: '8px 12px' }}
                        >
                            <Search size={20} />
                            <span className="hide-mobile">{t('navbar.lookup')}</span>
                        </button>
                    )}

                    <Link to="/" className="btn btn-ghost hide-mobile">
                        <Home size={20} />
                    </Link>

                    {token && (
                        <Link to="/suggestions" className="btn btn-ghost" title={language === 'en' ? 'Suggestions Board' : 'Buzón de Sugerencias'}>
                            <Lightbulb size={20} />
                        </Link>
                    )}

                    {token && (
                        <Link to="/communities" className="btn btn-ghost hide-mobile" title={language === 'en' ? 'Communities' : 'Comunidades'}>
                            <Users size={20} />
                        </Link>
                    )}

                    {user && (
                        <Link to={`/users/${user.username || 'me'}`} className="btn btn-ghost hide-mobile">
                            <User size={20} />
                        </Link>
                    )}

                    <button 
                        onClick={toggleLanguage} 
                        className="btn btn-ghost" 
                        style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '40px', padding: '8px' }}
                        title={language === 'en' ? "Switch to Spanish" : "Cambiar a Inglés"}
                    >
                        {language.toUpperCase()}
                    </button>

                    {/* Friend Requests Bell */}
                    {token && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="btn btn-ghost"
                                style={{ position: 'relative', padding: '10px' }}
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        backgroundColor: 'var(--error)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '16px',
                                        height: '16px',
                                        fontSize: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div
                                    ref={dropdownRef}
                                    className="notifications-dropdown"
                                >
                                    <div className="dropdown-header">
                                        {t('navbar.friendRequests')}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="dropdown-empty">
                                            {t('navbar.noRequests')}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className="dropdown-item"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, textAlign: 'left' }}>
                                                        <Link
                                                            to={`/users/${notif.sender_username}`}
                                                            onClick={() => setShowNotifications(false)}
                                                            style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                                                        >
                                                            {notif.sender_username}
                                                        </Link>
                                                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                                            {t('navbar.sentRequest')}
                                                        </span>
                                                    </div>
                                                    <div className="flex-center gap-2">
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }}
                                                            onClick={() => handleRespondRequest(notif.ref_id, 'accepted')}
                                                            title="Accept"
                                                        >
                                                            <Check size={14} color="white" />
                                                        </button>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--error)' }}
                                                            onClick={() => handleRespondRequest(notif.ref_id, 'rejected')}
                                                            title="Reject"
                                                        >
                                                            <X size={14} color="white" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={handleLogout} className="btn btn-ghost">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* User Lookup Modal */}
            {showLookup && (
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
                    <div className="card" style={{ width: '90%', maxWidth: '400px', position: 'relative' }}>
                        <button 
                            onClick={() => { setShowLookup(false); setLookupUsername(''); setLookupError(''); setSearchResults([]); setSearchPerformed(false); }}
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
                        <h3 className="text-lg mb-2" style={{ fontWeight: 600, textAlign: 'left' }}>{t('navbar.lookup')}</h3>
                        <p className="text-sm text-secondary mb-4" style={{ textAlign: 'left' }}>{language === 'en' ? 'Search for an Orbit user by username.' : 'Busca un usuario de Orbit por su nombre.'}</p>
                        
                        <form onSubmit={handleLookupSubmit}>
                            <input 
                                className="input mb-4"
                                placeholder={t('navbar.searchPlaceholder')}
                                value={lookupUsername}
                                onChange={(e) => setLookupUsername(e.target.value)}
                                required
                                autoFocus
                            />
                            {lookupError && (
                                <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'left' }}>
                                    {lookupError}
                                </p>
                            )}

                            {searchPerformed && searchResults.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    marginBottom: '16px',
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    paddingRight: '4px'
                                }}>
                                    <p className="text-sm text-secondary" style={{ textAlign: 'left', fontWeight: 600 }}>Results:</p>
                                    {searchResults.map(result => (
                                        <button
                                            key={result.id}
                                            type="button"
                                            onClick={() => {
                                                setShowLookup(false);
                                                setLookupUsername('');
                                                setSearchResults([]);
                                                setSearchPerformed(false);
                                                navigate(`/users/${result.username}`);
                                            }}
                                            className="btn btn-ghost flex-start gap-2"
                                            style={{
                                                width: '100%',
                                                justifyContent: 'flex-start',
                                                padding: '8px 12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                {result.avatar_url ? (
                                                    <img src={result.avatar_url} alt={`${result.username}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={12} color="var(--text-secondary)" />
                                                )}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{result.username}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    onClick={() => { setShowLookup(false); setLookupUsername(''); setLookupError(''); setSearchResults([]); setSearchPerformed(false); }}
                                    disabled={lookupLoading}
                                >
                                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={lookupLoading}
                                >
                                    {lookupLoading ? (language === 'en' ? 'Searching...' : 'Buscando...') : (language === 'en' ? 'Search' : 'Buscar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
