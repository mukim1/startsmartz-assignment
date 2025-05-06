import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import styles from './navbar.module.css';

const Navbar: React.FC = () => {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarBrand}>
        <Link to="/" className={styles.navbarLogo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V8M4 8H20M4 8L5.46154 5.38197C5.79977 4.7747 5.96889 4.47107 6.20673 4.24076C6.41848 4.03711 6.67661 3.88664 6.9584 3.80163C7.28077 3.7 7.64396 3.7 8.37033 3.7H15.6297C16.356 3.7 16.7192 3.7 17.0416 3.80163C17.3234 3.88664 17.5815 4.03711 17.7933 4.24076C18.0311 4.47107 18.2002 4.7747 18.5385 5.38197L20 8" stroke="#64FFDA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.5 13V16M14.5 13V16M9.5 13C9.5 12.4477 9.94772 12 10.5 12H13.5C14.0523 12 14.5 12.4477 14.5 13M9.5 13H14.5" stroke="#64FFDA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          VideoStream
        </Link>
      </div>
      
      <ul className={styles.navbarMenu}>
        {isAuthenticated ? (
          <>
            <li className={styles.navbarItem}>
              <Link to="/my-videos" className={styles.navbarLink}>
                My Videos
              </Link>
            </li>
            <li className={styles.navbarItem}>
              <Link to="/upload-video" className={styles.navbarLink}>
                Upload Video
              </Link>
            </li>
            <li className={`${styles.navbarItem} ${styles.navbarUser}`}>
              <span className={styles.userEmail}>{user?.email}</span>
              <button 
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </li>
          </>
        ) : (
          <>
            <li className={styles.navbarItem}>
              <Link to="/login" className={styles.navbarLink}>
                Log In
              </Link>
            </li>
            <li className={styles.navbarItem}>
              <Link to="/signup" className={`${styles.navbarLink} ${styles.signupLink}`}>
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