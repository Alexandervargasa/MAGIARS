// src/components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  return (
    <nav style={styles.navbar}>
      <style>{`
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px rgba(102, 126, 234, 0.5); }
          50% { text-shadow: 0 0 20px rgba(102, 126, 234, 0.8); }
        }
      `}</style>

      <div style={styles.navContent}>
        <Link to="/" style={styles.logoLink}>
          <h2 style={styles.logo}>✨ MAGIARS</h2>
        </Link>
        
        <div style={styles.navLinks}>
          <Link 
            to="/" 
            style={{
              ...styles.link,
              ...(isActive('/') ? styles.linkActive : {})
            }}
          >
            Inicio
          </Link>
          <Link 
            to="/about" 
            style={{
              ...styles.link,
              ...(isActive('/about') ? styles.linkActive : {})
            }}
          >
            Acerca de
          </Link>
          <Link 
            to="/dashboard" 
            style={{
              ...styles.link,
              ...(isActive('/dashboard') ? styles.linkActive : {})
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    padding: '0 20px',
    background: 'rgba(15, 12, 41, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },

  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px',
  },

  logoLink: {
    textDecoration: 'none',
  },

  logo: {
    display: 'inline',
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '2px',
    animation: 'glow 3s ease-in-out infinite',
  },

  navLinks: {
    display: 'flex',
    gap: '30px',
  },

  link: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    padding: '8px 16px',
    borderRadius: '8px',
  },

  linkActive: {
    background: 'rgba(102, 126, 234, 0.2)',
    borderLeft: '2px solid #667eea',
    borderRight: '2px solid #667eea',
  },
};

export default Navbar;