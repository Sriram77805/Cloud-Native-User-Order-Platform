import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      onLogin(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-gradient-main">
      <div className="card w-full max-w-md animate-pulse-slow">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-8 text-sm">Login to your account</p>
        
        {error && <div className="error-alert mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-gray-900 font-semibold mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-900 font-semibold mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Don't have an account? <Link to="/register" className="text-primary font-semibold hover:text-secondary transition">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
