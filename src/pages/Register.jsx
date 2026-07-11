import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        bio: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://127.0.0.1:8000/users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="flex-center mb-4">
                    <UserPlus size={40} color="var(--accent-secondary)" />
                </div>
                <h2 className="text-xl flex-center mb-4">Create Account</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">Username</label>
                        <input
                            type="text"
                            className="input mt-2"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">Email</label>
                        <input
                            type="email"
                            className="input mt-2"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">Password</label>
                        <input
                            type="password"
                            className="input mt-2"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-secondary">Bio (Optional)</label>
                        <textarea
                            className="input mt-2"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-secondary)' }}>
                        Sign Up
                    </button>
                </form>
                <div className="mt-4 flex-center text-sm">
                    <span className="text-secondary">Already have an account?</span>
                    <Link to="/login" style={{ marginLeft: '5px', color: 'var(--accent-primary)' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
