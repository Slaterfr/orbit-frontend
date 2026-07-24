import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, User, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BottomNav = () => {
    const location = useLocation();
    const { language } = useLanguage();

    return (
        <div className="bottom-nav">
            <Link to="/" className={`bottom-nav-btn ${location.pathname === '/' ? 'active' : ''}`}>
                <Home size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Home' : 'Inicio'}
                </span>
            </Link>

            <Link to="/create" className={`bottom-nav-btn ${location.pathname === '/create' ? 'active' : ''}`}>
                <PlusCircle size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Create' : 'Crear'}
                </span>
            </Link>

            <Link to="/communities" className={`bottom-nav-btn ${location.pathname.startsWith('/communities') ? 'active' : ''}`}>
                <Users size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {language === 'en' ? 'Groups' : 'Grupos'}
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
