import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { parseJwt } from '../utils';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email); // OAuth2PasswordRequestForm expects 'username' field, usually mapped to email
            formData.append('password', password);

            const response = await fetch('http://127.0.0.1:8000/auth/login', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            const decoded = parseJwt(data.access_token);
            const userData = { 
                email: email, 
                id: decoded?.user_id || decoded?.sub,
                role: decoded?.role
            }; 

            login(userData, data.access_token);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
            console.error(err);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="flex-center mb-4">
                    <LogIn size={40} color="var(--accent-primary)" />
                </div>
                <h2 className="text-xl flex-center mb-4">Welcome Back</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">Email</label>
                        <input
                            type="email"
                            className="input mt-2"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">Password</label>
                        <input
                            type="password"
                            className="input mt-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Sign In
                    </button>
                </form>
                <div className="mt-4 flex-center text-sm">
                    <span className="text-secondary">Don't have an account?</span>
                    <Link to="/register" style={{ marginLeft: '5px', color: 'var(--accent-primary)' }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
