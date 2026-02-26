import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-primary to-secondary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold hover:opacity-90 transition">
          ☁️ Cloud Native Platform
        </Link>
        <div className="flex gap-8 items-center">
          <Link to="/dashboard" className="text-white font-semibold hover:opacity-80 transition">Dashboard</Link>
          <Link to="/orders" className="text-white font-semibold hover:opacity-80 transition">Orders</Link>
          <button 
            onClick={handleLogout}
            className="bg-white bg-opacity-20 text-white border-2 border-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-primary transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
