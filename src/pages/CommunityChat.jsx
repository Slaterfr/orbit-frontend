import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { 
    Users, Send, ArrowLeft, Loader, Settings, X, Trash2, 
    CornerUpLeft, Camera, User, Check, ShieldAlert, Award 
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { parseApiError } from '../utils/errorParser';

const CommunityChat = () => {
    const { id } = useParams();
    const { token, user } = useAuth();
    const { language } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [community, setCommunity] = useState(null);
    const [members, setMembers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { id, username, content }
    const [showSidebar, setShowSidebar] = useState(true); // Toggle on mobile
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');

    // Refs
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fetch initial chat history and community detail
    const fetchChatInfo = async () => {
        setLoading(true);
        try {
            // Get details
            const detailRes = await fetch(`${API_BASE_URL}/communities/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!detailRes.ok) {
                if (detailRes.status === 403) {
                    showToast(language === 'en' ? 'Access denied' : 'Acceso denegado');
                }
                navigate('/communities');
                return;
            }
            const detailData = await detailRes.json();
            setCommunity(detailData);

            // Get members
            const membersRes = await fetch(`${API_BASE_URL}/communities/${id}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (membersRes.ok) {
                const membersData = await membersRes.json();
                setMembers(membersData);
            }

            // Get message history
            const msgRes = await fetch(`${API_BASE_URL}/communities/${id}/messages?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                setMessages(msgData);
            }

            // Get join requests if owner or mod
            if (detailData.role_in_community === 'owner' || detailData.role_in_community === 'moderator') {
                fetchJoinRequests();
            }

        } catch (err) {
            console.error("Failed to load community details", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchJoinRequests = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/communities/${id}/join-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJoinRequests(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Auto scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // WebSocket logic with ticket auth
    useEffect(() => {
        if (!token || !id) return;

        fetchChatInfo();

        let wsConnection = null;
        let isAlive = true;

        const connectWS = async () => {
            try {
                // 1. Fetch short-lived ticket
                const ticketRes = await fetch(`${API_BASE_URL}/communities/ws-ticket`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!ticketRes.ok) return;
                const { ticket } = await ticketRes.json();

                if (!isAlive) return;

                // 2. Open WebSocket connection
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const rawHost = API_BASE_URL.replace(/^http(s)?:\/\//, '');
                const wsUrl = `${protocol}//${rawHost}/communities/${id}/ws?ticket=${ticket}`;
                
                wsConnection = new WebSocket(wsUrl);
                wsRef.current = wsConnection;

                wsConnection.onopen = () => {
                    console.log("WebSocket connected successfully");
                };

                wsConnection.onmessage = (event) => {
                    try {
                        const packet = JSON.parse(event.data);
                        if (packet.event === 'new_message') {
                            setMessages(prev => {
                                // Prevent duplicate append
                                if (prev.some(m => m.id === packet.data.id)) return prev;
                                return [...prev, packet.data];
                            });
                        } else if (packet.event === 'delete_message') {
                            const deletedId = packet.data.message_id;
                            setMessages(prev => prev.filter(m => m.id !== deletedId));
                        }
                    } catch (e) {
                        console.error("Failed to parse websocket message packet", e);
                    }
                };

                wsConnection.onclose = (event) => {
                    console.log("WebSocket closed, retrying in 3 seconds...", event.reason);
                    if (isAlive) {
                        setTimeout(connectWS, 3000);
                    }
                };

            } catch (err) {
                console.error("WS error during connection flow", err);
                if (isAlive) {
                    setTimeout(connectWS, 5000);
                }
            }
        };

        connectWS();

        // Check window screen width for responsive sidebar default
        if (window.innerWidth < 991) {
            setShowSidebar(false);
        }

        return () => {
            isAlive = false;
            if (wsConnection) {
                wsConnection.close();
            }
        };
    }, [id, token]);

    // Handle sending a message
    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        const payload = {
            content: text,
            reply_to_message_id: replyingTo ? replyingTo.id : null
        };

        wsRef.current.send(JSON.stringify(payload));
        setInputText('');
        setReplyingTo(null);
    };

    // Deleting a message via REST endpoint (which triggers WS broadcast to all)
    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this message?' : '¿Estás seguro de que deseas borrar este mensaje?')) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/messages/${msgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to delete message'));
            }
        } catch (err) {
            console.error("Message delete failed", err);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        if (!inviteUsername.trim()) return;

        setInviteLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/communities/${id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: inviteUsername.trim() })
            });

            if (res.ok) {
                showToast(language === 'en' ? 'Invitation sent successfully!' : '¡Invitación enviada con éxito!');
                setInviteUsername('');
                setShowInviteModal(false);
            } else {
                const errData = await res.json();
                setInviteError(parseApiError(errData, 'Failed to send invitation'));
            }
        } catch (err) {
            setInviteError(language === 'en' ? 'Network error occurred.' : 'Ocurrió un error de red.');
        } finally {
            setInviteLoading(false);
        }
    };

    // Promote, demote or transfer ownership
    const handleRoleChange = async (targetUserId, newRole) => {
        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/members/${targetUserId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ community_role: newRole })
            });

            if (response.ok) {
                showToast(language === 'en' ? 'Role updated successfully!' : '¡Rol actualizado con éxito!');
                fetchChatInfo(); // reload members
            } else {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to update role'));
            }
        } catch (err) {
            console.error("Role update failed", err);
        }
    };

    // Kick community member
    const handleKickMember = async (targetUserId) => {
        if (!window.confirm(language === 'en' ? 'Are you sure you want to kick this member?' : '¿Estás seguro de que deseas expulsar a este miembro?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/members/${targetUserId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showToast(language === 'en' ? 'Member kicked.' : 'Miembro expulsado.');
                fetchChatInfo(); // reload members
            } else {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to kick member'));
            }
        } catch (err) {
            console.error("Kick member failed", err);
        }
    };

    // Approve/Reject requests
    const handleResolveRequest = async (requestId, statusValue) => {
        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/join-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: statusValue })
            });

            if (response.ok) {
                showToast(statusValue === 'approved' 
                    ? (language === 'en' ? 'Request approved!' : '¡Solicitud aprobada!') 
                    : (language === 'en' ? 'Request rejected.' : 'Solicitud rechazada.'));
                fetchJoinRequests();
                fetchChatInfo(); // Reload member list
            } else {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to resolve request'));
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Upload community avatar
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAvatarUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const updated = await response.json();
                setCommunity(updated);
                showToast(language === 'en' ? 'Community avatar updated!' : '¡Avatar de comunidad actualizado!');
            } else {
                const errData = await response.json();
                showToast(parseApiError(errData, 'Failed to upload avatar'));
            }
        } catch (err) {
            console.error(err);
            showToast(language === 'en' ? 'Network error uploading image' : 'Error de red al subir imagen');
        } finally {
            setAvatarUploading(false);
        }
    };

    // Checks permission for deleting messages
    const canDeleteMsg = (msg) => {
        if (!community || !user) return false;
        if (msg.issuer_id === user.id) return true;
        const role = community.role_in_community;
        if (role === 'owner') return true;
        if (role === 'moderator') {
            // Mods can't delete owners' messages
            if (msg.issuer_id === community.owner_id) return false;
            return true;
        }
        return false;
    };

    if (loading || !community) {
        return (
            <div className="flex-center" style={{ padding: '128px 0' }}>
                <Loader size={36} className="animate-spin" color="var(--accent-secondary)" />
            </div>
        );
    }

    return (
        <div className="chat-layout-container">
            {/* Left/Right Main chat space */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(24, 24, 27, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                {/* Chat Top Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Link to="/communities" className="btn btn-ghost flex-center" style={{ padding: '8px' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-tertiary)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        {community.avatar_url ? (
                            <img src={community.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Users size={18} color="var(--text-secondary)" />
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{community.name}</h3>
                        <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {community.slogan || (language === 'en' ? 'Chat Room' : 'Sala de Chat')}
                        </p>
                    </div>

                    <button 
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="btn btn-ghost flex-center"
                        style={{ padding: '8px' }}
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {/* Messages Timeline */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {messages.length === 0 ? (
                        <div className="text-center text-secondary text-sm" style={{ margin: 'auto' }}>
                            {language === 'en' ? 'No messages here yet. Send a greetings!' : 'Aún no hay mensajes aquí. ¡Envía un saludo!'}
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.issuer_id === user.id;
                            return (
                                <div 
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        alignItems: 'flex-start',
                                        gap: '8px'
                                    }}
                                >
                                    {/* Author Profile image */}
                                    {!isMe && (
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid var(--border-color)',
                                            marginTop: '4px'
                                        }}>
                                            {msg.user?.avatar_url ? (
                                                <img src={msg.user.avatar_url} alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={16} color="var(--text-secondary)" />
                                            )}
                                        </div>
                                    )}

                                    {/* Message bubble card */}
                                    <div 
                                        style={{
                                            maxWidth: '70%',
                                            backgroundColor: isMe ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-tertiary)',
                                            border: isMe ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            position: 'relative',
                                            textAlign: 'left'
                                        }}
                                        className="message-bubble"
                                    >
                                        {!isMe && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: 'var(--accent-secondary)',
                                                display: 'block',
                                                marginBottom: '4px'
                                            }}>
                                                {msg.user?.username}
                                            </span>
                                        )}

                                        {/* Reply Quote container */}
                                        {msg.reply_to_message_id && msg.replied_to_message_content && (
                                            <div style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                borderLeft: '3px solid var(--accent-secondary)',
                                                borderRadius: '4px',
                                                padding: '6px 10px',
                                                marginBottom: '8px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <span style={{ fontWeight: 650, display: 'block', color: 'var(--text-primary)' }}>
                                                    @{msg.replied_to_message_username}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {msg.replied_to_message_content}
                                                </span>
                                            </div>
                                        )}

                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                                            {msg.content}
                                        </p>

                                        {/* Date and hover actions footer */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: '6px',
                                            gap: '12px'
                                        }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>

                                            {/* Hover buttons */}
                                            <div className="message-hover-actions" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <button 
                                                    onClick={() => setReplyingTo({ id: msg.id, username: msg.user?.username || 'user', content: msg.content })}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
                                                    title={language === 'en' ? 'Reply' : 'Responder'}
                                                >
                                                    <CornerUpLeft size={14} />
                                                </button>
                                                {canDeleteMsg(msg) && (
                                                    <button 
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '2px' }}
                                                        title={language === 'en' ? 'Delete' : 'Borrar'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply state indicator above input box */}
                {replyingTo && (
                    <div style={{
                        padding: '8px 20px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.825rem'
                    }}>
                        <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '8px', textAlign: 'left', minWidth: 0 }}>
                            <span style={{ fontWeight: 650, display: 'block' }}>Replying to @{replyingTo.username}</span>
                            <span style={{ color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {replyingTo.content}
                            </span>
                        </div>
                        <button 
                            onClick={() => setReplyingTo(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Bottom text Input Area */}
                <form 
                    onSubmit={handleSendMessage}
                    style={{
                        padding: '16px 20px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}
                >
                    <input 
                        className="input"
                        placeholder={language === 'en' ? 'Type a message...' : 'Escribe un mensaje...'}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        style={{ margin: 0 }}
                    />
                    <button 
                        type="submit"
                        className="btn btn-primary flex-center"
                        style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--accent-secondary)',
                            borderRadius: '10px'
                        }}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

            {/* Sidebar (Community detail + Member controls) */}
            {showSidebar && (
                <div style={{
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(24, 24, 27, 0.65)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    overflowY: 'auto'
                }} className="community-sidebar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>{language === 'en' ? 'Info & Members' : 'Info y Miembros'}</h4>
                        <button 
                            onClick={() => setShowSidebar(false)}
                            className="btn btn-ghost flex-center hide-desktop"
                            style={{ padding: '4px' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Community Meta Info with Avatar Camera upload triggers */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '20px',
                                backgroundColor: 'var(--bg-tertiary)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--border-color)'
                            }}>
                                {community.avatar_url ? (
                                    <img src={community.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Users size={32} color="var(--text-secondary)" />
                                )}
                            </div>

                            {/* Camera overlay only for Owner / Admin */}
                            {(community.role_in_community === 'owner' || user?.role === 'admin') && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '-4px',
                                        backgroundColor: 'var(--accent-secondary)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                        color: '#fff'
                                    }}
                                >
                                    {avatarUploading ? <Loader size={12} className="animate-spin" /> : <Camera size={14} />}
                                </button>
                            )}
                        </div>

                        {/* Hidden input file tag */}
                        <input 
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />

                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>{community.name}</h4>
                            <p className="text-secondary text-sm" style={{ margin: 0 }}>{community.slogan}</p>
                        </div>
                    </div>

                    {/* Join requests review buttons (Visible only to Owner/Mods) */}
                    {(community.role_in_community === 'owner' || community.role_in_community === 'moderator') && joinRequests.length > 0 && (
                        <button 
                            onClick={() => setShowRequestsModal(true)}
                            className="btn btn-primary mb-4"
                            style={{ width: '100%', fontSize: '0.85rem', backgroundColor: '#fbbf24', color: '#18181b', fontWeight: 600 }}
                        >
                            {language === 'en' 
                                ? `Review Requests (${joinRequests.length})` 
                                : `Revisar Solicitudes (${joinRequests.length})`}
                        </button>
                    )}

                    {/* Members List */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                {language === 'en' ? 'MEMBERS' : 'MIEMBROS'} ({members.length})
                            </span>
                            {(community.role_in_community === 'owner' || community.role_in_community === 'moderator') && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="btn btn-ghost"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                                    title={language === 'en' ? 'Invite user' : 'Invitar usuario'}
                                >
                                    <span>+</span>
                                    <span>{language === 'en' ? 'Invite' : 'Invitar'}</span>
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {members.map((mbr) => {
                                const isOwner = mbr.community_role === 'owner';
                                const isMod = mbr.community_role === 'moderator';

                                return (
                                    <div 
                                        key={mbr.user_id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 0'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid var(--border-color)',
                                                flexShrink: 0
                                            }}>
                                                {mbr.user?.avatar_url ? (
                                                    <img src={mbr.user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={14} color="var(--text-secondary)" />
                                                )}
                                            </div>
                                            
                                            {/* Username + role badges */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {mbr.user?.username}
                                                </span>
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                                    {isOwner && (
                                                        <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(236,72,153,0.15)', color: 'var(--accent-secondary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                            <Award size={10} /> Owner
                                                        </span>
                                                    )}
                                                    {isMod && (
                                                        <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                            <ShieldAlert size={10} /> Mod
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role management controls for Owner */}
                                        {community.role_in_community === 'owner' && mbr.user_id !== user.id && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <select 
                                                    value={mbr.community_role}
                                                    onChange={(e) => handleRoleChange(mbr.user_id, e.target.value)}
                                                    className="input"
                                                    style={{
                                                        width: 'auto',
                                                        padding: '2px 4px',
                                                        fontSize: '0.7rem',
                                                        margin: 0,
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        borderColor: 'var(--border-color)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="moderator">Mod</option>
                                                    <option value="owner">Transfer Owner</option>
                                                </select>
                                                
                                                <button 
                                                    onClick={() => handleKickMember(mbr.user_id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}
                                                    title={language === 'en' ? 'Kick member' : 'Expulsar miembro'}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Mod controls (can only kick standard members) */}
                                        {community.role_in_community === 'moderator' && mbr.community_role === 'member' && mbr.user_id !== user.id && (
                                            <button 
                                                onClick={() => handleKickMember(mbr.user_id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px', marginLeft: 'auto' }}
                                                title={language === 'en' ? 'Kick member' : 'Expulsar miembro'}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Join Requests modal */}
            {showRequestsModal && (
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
                            onClick={() => setShowRequestsModal(false)}
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
                        <h3 className="text-lg mb-4" style={{ fontWeight: 600, textAlign: 'left' }}>
                            {language === 'en' ? 'Join Requests' : 'Solicitudes de Ingreso'}
                        </h3>

                        {joinRequests.length === 0 ? (
                            <p className="text-secondary text-sm" style={{ padding: '24px 0' }}>
                                {language === 'en' ? 'No pending requests.' : 'No hay solicitudes pendientes.'}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                                {joinRequests.map((req) => (
                                    <div 
                                        key={req.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 12px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                backgroundColor: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                {req.user?.avatar_url ? (
                                                    <img src={req.user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={12} color="var(--text-secondary)" />
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.user?.username}</span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button 
                                                onClick={() => handleResolveRequest(req.id, 'approved')}
                                                className="btn btn-primary"
                                                style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#34d399', color: '#18181b', minWidth: 'auto' }}
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleResolveRequest(req.id, 'rejected')}
                                                className="btn btn-ghost"
                                                style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--error)' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Invite User Modal */}
            {showInviteModal && (
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
                    <div className="card" style={{ width: '90%', maxWidth: '400px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 700 }}>
                                {language === 'en' ? 'Invite Member' : 'Invitar Miembro'}
                            </h3>
                            <button onClick={() => { setShowInviteModal(false); setInviteError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {language === 'en' ? 'Username' : 'Nombre de Usuario'}
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={language === 'en' ? "Enter username to invite" : "Ingrese nombre de usuario a invitar"}
                                    value={inviteUsername}
                                    onChange={(e) => setInviteUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            {inviteError && (
                                <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                                    {inviteError}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => { setShowInviteModal(false); setInviteError(''); }}
                                    disabled={inviteLoading}
                                >
                                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={inviteLoading}
                                >
                                    {inviteLoading ? (language === 'en' ? 'Inviting...' : 'Invitando...') : (language === 'en' ? 'Send Invite' : 'Enviar Invitación')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityChat;
