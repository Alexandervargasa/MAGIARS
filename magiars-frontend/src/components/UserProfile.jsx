// src/components/UserProfile.jsx
import React, { useState } from "react";
import api from "../services/api.js";

export default function UserProfile({ user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("metaAccessToken");
      if (onLogout) onLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Profile Button */}
      <div 
        style={styles.profileButton}
        onClick={() => setShowMenu(!showMenu)}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            style={styles.avatar}
          />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
        )}

        <div style={styles.userInfo}>
          <span style={styles.userName}>
            {user.name || "Usuario"}
          </span>
          <span style={styles.userRole}>Administrador</span>
        </div>

        <span style={{
          ...styles.chevron,
          transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <div style={styles.dropdownUserInfo}>
              <strong style={styles.dropdownName}>
                {user.name || "Usuario"}
              </strong>
            </div>
          </div>

          <div style={styles.dropdownDivider}></div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            <span style={styles.logoutIcon}>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
  },

  // PROFILE BUTTON
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(102, 126, 234, 0.5)',
  },

  avatarPlaceholder: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    border: '2px solid rgba(102, 126, 234, 0.5)',
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    lineHeight: '1.2',
  },

  userRole: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: '2px',
  },

  chevron: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.7)',
    transition: 'transform 0.3s ease',
    marginLeft: '5px',
  },

  // DROPDOWN MENU
  dropdown: {
    position: 'absolute',
    top: '55px',
    right: '0',
    width: '260px',
    background: 'rgba(15, 12, 41, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    animation: 'slideDown 0.3s ease-out',
    overflow: 'hidden',
  },

  dropdownHeader: {
    padding: '20px',
  },

  dropdownUserInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  dropdownName: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: '600',
  },

  dropdownEmail: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  dropdownDivider: {
    height: '1px',
    background: 'rgba(102, 126, 234, 0.2)',
    margin: '0 15px',
  },

  // LOGOUT BUTTON
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px 20px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },

  logoutIcon: {
    fontSize: '18px',
  },
};