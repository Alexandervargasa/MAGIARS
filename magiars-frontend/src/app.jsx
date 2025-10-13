// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import LoginMeta from "./components/LoginMeta";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import About from "./pages/About";
import Inbox from "./pages/Inbox.jsx";
import Integrations from "./pages/Integrations.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import ConnectionStatusBanner from "./components/ConnectionStatusBanner.jsx";
import UserProfile from "./components/UserProfile.jsx";
import DataDeletion from "./pages/DataDeletion.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si hay usuario, mostrar la app completa
  if (user) {
    return (
      <div>
        <ConnectionStatusBanner />
        <nav style={{ padding: 12, background: "#111827", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link to="/" style={{ color: "white", marginRight: 12 }}>Inicio</Link>
            <Link to="/inbox" style={{ color: "white", marginRight: 12 }}>Inbox</Link>
            <Link to="/integrations" style={{ color: "white", marginRight: 12 }}>Integraciones</Link>
            <Link to="/about" style={{ color: "white", marginRight: 12 }}>Acerca de</Link>
          </div>
          <UserProfile user={user} onLogout={handleLogout} />
        </nav>

        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={
              <div>
                <h1>MAGIARS Frontend funcionando 🚀</h1>
                <p>Bienvenido — prueba el chat para escalar un caso.</p>
                <ChatWidget />
              </div>
            } />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/about" element={<About />} />
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
      <Route path="*" element={<LoginMeta onLoginSuccess={() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      }} />} />
    </Routes>
  );
}