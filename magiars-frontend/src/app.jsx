// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LoginMeta from "./components/LoginMeta";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Inbox from "./pages/Inbox.jsx";
import Integrations from "./pages/Integrations.jsx";
import ConnectionStatusBanner from "./components/ConnectionStatusBanner.jsx";
import UserProfile from "./components/UserProfile.jsx";
import DataDeletion from "./pages/DataDeletion.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay usuario autenticado
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    setLoading(false);

    // Actualizar path actual para estilos activos
    const updatePath = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavClick = (path) => {
    setCurrentPath(path);
    navigate(path);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Cargando...</p>
      </div>
    );
  }

   // Si hay usuario, mostrar la app completa
  if (user) {
    return (
      <div style={styles.appContainer}>
        {/* Agregar el estilo global aquí */}
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body, #root {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100vh;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 10px rgba(102, 126, 234, 0.3); }
            50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
          }
        `}</style>
        
        <ConnectionStatusBanner />
        
        {/* Navbar Futurista */}
        <nav style={styles.navbar}>
          <div style={styles.navContent}>
            {/* Logo */}
            <h1 style={styles.logo}>✨ MAGIARS</h1>
            
            {/* Nav Links */}
            <div style={styles.navLinks}>
              {[
                { path: '/', label: 'Inicio' },
                { path: '/dashboard', label: 'Dashboard' },
                { path: '/inbox', label: 'Inbox' },
                { path: '/integrations', label: 'Integraciones' },
                { path: '/about', label: 'Acerca de' }
              ].map(({ path, label }) => (
                <button
                  key={path}
                  onClick={() => handleNavClick(path)}
                  style={{
                    ...styles.navButton,
                    ...(currentPath === path ? styles.navButtonActive : {})
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* User Profile */}
            <div style={styles.userProfileContainer}>
              <UserProfile user={user} onLogout={handleLogout} />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/about" element={<About />} />
            <Route path="/data-deletion" element={<DataDeletion />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Si no hay usuario, mostrar rutas de autenticación
  return (
    <Routes>
      <Route path="/login" element={<LoginMeta onLoginSuccess={() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      }} />} />
      <Route path="/auth/callback" element={<AuthCallback onLoginSuccess={() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      }} />} />
      <Route path="/data-deletion" element={<DataDeletion />} />
      <Route path="*" element={<LoginMeta onLoginSuccess={() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      }} />} />
    </Routes>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },

  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  
  loader: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(102, 126, 234, 0.2)',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    marginTop: '20px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '300',
  },

  // NAVBAR FUTURISTA
  navbar: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '0 20px',
  },
  
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px',
  },
  
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    letterSpacing: '2px',
    cursor: 'default',
  },
  
  navLinks: {
    display: 'flex',
    gap: '20px',
  },
  
  navButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    textTransform: 'capitalize',
  },
  
  navButtonActive: {
    background: 'rgba(102, 126, 234, 0.2)',
    borderLeft: '2px solid #667eea',
    borderRight: '2px solid #667eea',
  },
  
  userProfileContainer: {
    display: 'flex',
    alignItems: 'center',
  },

  // MAIN CONTENT
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    width: '100%',
    animation: 'fadeIn 0.6s ease-in',
  },
};