import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          VideoStream
        </Link>
      </div>
      
      <ul className="navbar-menu">
        {isAuthenticated ? (
          <>
            <li className="navbar-item">
              <Link to="/my-videos" className="navbar-link">
                My Videos
              </Link>
            </li>
            <li className="navbar-item">
              <Link to="/upload-video" className="navbar-link">
                Upload Video
              </Link>
            </li>
            <li className="navbar-item navbar-user">
              <span className="user-email">{user?.email}</span>
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </li>
          </>
        ) : (
          <>
            <li className="navbar-item">
              <Link to="/login" className="navbar-link">
                Log In
              </Link>
            </li>
            <li className="navbar-item">
              <Link to="/signup" className="navbar-link signup-link">
                Sign Up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;