import { useNavigate } from 'react-router-dom';
import {
    Github,
    Linkedin,
    Instagram,
    ArrowRight,
    Terminal,
    Layout,
    Image as ImageIcon,
    Mail
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Landing = () => {
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguage();

    const handleCreatorScroll = () => {
        const element = document.getElementById('creator-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#f1f5f9',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative'
        }}>
            {/* Glowing Backdrop Accents */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '5%',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '15%',
                right: '5%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Header / Navigation */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 8%',
                borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                backdropFilter: 'blur(8px)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backgroundColor: 'rgba(15, 23, 42, 0.8)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
                    }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>O</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>Orbit</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={toggleLanguage}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '40px', padding: '8px' }}
                    >
                        {language.toUpperCase()}
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                        {t('auth.loginBtn')}
                    </button>
                </div>
            </header>

            {/* Main Content Wrapper */}
            <main style={{ padding: '0 8%', position: 'relative', zIndex: 10 }}>

                {/* Hero Section */}
                <section style={{
                    padding: '100px 0 80px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh'
                }}>
                    {/* Pulsing Orbit Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#60a5fa',
                        marginBottom: '24px',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'inline-block',
                            animation: 'pulse 2s infinite'
                        }} />
                        v1.0 {language === 'en' ? 'Live Mockup' : 'Prueba en vivo'}
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        marginBottom: '20px',
                        maxWidth: '850px',
                        background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px'
                    }}>
                        {t('landing.heroTitle')}
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 1.25vw, 1.25rem)',
                        lineHeight: 1.6,
                        color: '#94a3b8',
                        maxWidth: '650px',
                        marginBottom: '40px'
                    }}>
                        {t('landing.heroSubtitle')}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/register')}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 28px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.35)'
                            }}
                        >
                            {t('landing.exploreBtn')}
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={handleCreatorScroll}
                            className="btn btn-ghost"
                            style={{
                                padding: '14px 28px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                border: '1px solid #334155',
                                backgroundColor: 'rgba(30, 41, 59, 0.4)'
                            }}
                        >
                            {t('landing.meetCreatorBtn')}
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section style={{ padding: '80px 0 100px', borderTop: '1px solid rgba(51, 65, 85, 0.3)' }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: '48px',
                        color: '#fff'
                    }}>
                        {t('landing.featuresTitle')}
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '24px',
                        maxWidth: '1100px',
                        margin: '0 auto'
                    }}>
                        {/* Feature 1 */}
                        <div style={{
                            padding: '32px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#3b82f6'
                            }}>
                                <Terminal size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                                {t('landing.featFastApiTitle')}
                            </h3>
                            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#94a3b8' }}>
                                {t('landing.featFastApiDesc')}
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div style={{
                            padding: '32px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#8b5cf6'
                            }}>
                                <Layout size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                                {t('landing.featReactTitle')}
                            </h3>
                            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#94a3b8' }}>
                                {t('landing.featReactDesc')}
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div style={{
                            padding: '32px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981'
                            }}>
                                <ImageIcon size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                                {t('landing.featPillowTitle')}
                            </h3>
                            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#94a3b8' }}>
                                {t('landing.featPillowDesc')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Creator Spotlight Section */}
                <section
                    id="creator-section"
                    style={{
                        padding: '100px 0 120px',
                        borderTop: '1px solid rgba(51, 65, 85, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: '48px',
                        color: '#fff'
                    }}>
                        {t('landing.creatorTitle')}
                    </h2>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '48px',
                        maxWidth: '850px',
                        padding: '32px',
                        borderRadius: '24px',
                        backgroundColor: 'rgba(30, 41, 59, 0.3)',
                        border: '1px solid rgba(51, 65, 85, 0.4)',
                        backdropFilter: 'blur(12px)'
                    }}>
                        {/* Avatar Image */}
                        <div style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid #3b82f6',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                            flexShrink: 0
                        }}>
                            <img
                                src="/creator_avatar.png"
                                alt="Slater - Developer Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Biography / Bio details */}
                        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>Slater</h3>
                            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#cbd5e1', margin: 0 }}>
                                {t('landing.creatorBio')}
                            </p>

                            <hr style={{ border: 0, borderTop: '1px solid rgba(51, 65, 85, 0.4)', margin: '8px 0' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('landing.creatorSocials')}
                                </span>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {/* Github */}
                                    <a
                                        href="https://github.com/Slaterfr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#cbd5e1',
                                            transition: 'all 0.2s ease',
                                            textDecoration: 'none'
                                        }}
                                        title="GitHub"
                                    >
                                        <Github size={20} />
                                    </a>
                                    {/* Linkedin */}
                                    <a
                                        href="https://www.linkedin.com/in/jefferson-villalobos-415655310/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#cbd5e1',
                                            transition: 'all 0.2s ease',
                                            textDecoration: 'none'
                                        }}
                                        title="LinkedIn"
                                    >
                                        <Linkedin size={20} />
                                    </a>
                                    {/* Instagram */}
                                    <a
                                        href="https://www.instagram.com/jslavl/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#cbd5e1',
                                            transition: 'all 0.2s ease',
                                            textDecoration: 'none'
                                        }}
                                        title="Instagram"
                                    >
                                        <Instagram size={20} />
                                    </a>
                                    {/* Email */}
                                    <a
                                        href="mailto:slavillalobos1@gmail.com"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#cbd5e1',
                                            transition: 'all 0.2s ease',
                                            textDecoration: 'none'
                                        }}
                                        title="Email"
                                    >
                                        <Mail size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer style={{
                textAlign: 'center',
                padding: '40px 8%',
                backgroundColor: '#0b0f19',
                borderTop: '1px solid rgba(51, 65, 85, 0.4)',
                fontSize: '0.85rem',
                color: '#64748b',
                position: 'relative',
                zIndex: 10
            }}>
                <p style={{ margin: '0 0 8px' }}>
                    © 2026 Orbit. {language === 'en' ? 'Created by' : 'Creado por'} <a href="https://github.com/Slaterfr" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Slater</a>.
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                    {language === 'en' ? 'Built with Python FastAPI, React, Vite & Pillow' : 'Construido con Python FastAPI, React, Vite y Pillow'}
                </p>
            </footer>
        </div>
    );
};

export default Landing;
