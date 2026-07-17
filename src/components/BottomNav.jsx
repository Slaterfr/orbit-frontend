import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusCircle, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const BottomNav = () => {
    const location = useLocation();
    const { language } = useLanguage();
    const { showToast } = useToast();

    const handleCommunitiesClick = (e) => {
        e.preventDefault();
        showToast(language === 'en' ? 'Communities feature coming soon!' : '¡La función de comunidades llegará pronto!');
    };

    return (
        <div className="bottom-nav">
            <Link to="/" className={`bottom-nav-btn ${location.pathname === '/' ? 'active' : ''}`}>
                <Home size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Home' : 'Inicio'}
                </span>
            </Link>

            <a href="#communities" onClick={handleCommunitiesClick} className="bottom-nav-btn">
                <Users size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Groups' : 'Grupos'}
                </span>
            </a>

            <Link to="/create" className={`bottom-nav-btn ${location.pathname === '/create' ? 'active' : ''}`}>
                <PlusCircle size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Create' : 'Crear'}
                </span>
            </Link>

            <Link to="/users/me" className={`bottom-nav-btn ${location.pathname.startsWith('/users/') ? 'active' : ''}`}>
                <User size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Profile' : 'Perfil'}
                </span>
            </Link>
        </div>
    );
};

export default BottomNav;
