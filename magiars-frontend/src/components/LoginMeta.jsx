// src/components/LoginMeta.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";

export default function LoginMeta({ onLoginSuccess }) {
  const [loginUrl, setLoginUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLoginUrl();
  }, []);

  const fetchLoginUrl = async () => {
    try {
      const data = await api.getMetaLoginUrl();
      setLoginUrl(data.loginUrl);
    } catch (err) {
      setError("Error al obtener URL de login: " + err.message);
    }
  };

  const handleMetaLogin = () => {
    if (!loginUrl) {
      setError("URL de login no disponible");
      return;
    }

    // Guardar información para callback
    localStorage.setItem("metaLoginInProgress", "true");

    // Abrir ventana de Meta
    window.location.href = loginUrl;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h1 style={{ marginBottom: "10px", color: "#333" }}>🌐 MAGIARS</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          Inicia sesión con tu cuenta de Meta (Facebook/Instagram)
        </p>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c33",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleMetaLogin}
          disabled={!loginUrl || loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loginUrl && !loading ? "#0A66C2" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loginUrl && !loading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "background 0.3s",
          }}
          onMouseEnter={(e) => {
            if (loginUrl && !loading) e.target.style.background = "#094da1";
          }}
          onMouseLeave={(e) => {
            if (loginUrl && !loading) e.target.style.background = "#0A66C2";
          }}
        >
          {loading ? "Procesando..." : "🔐 Iniciar con Meta"}
        </button>

        <p style={{ fontSize: "12px", color: "#999", marginTop: "20px" }}>
          Tu datos están seguros con nosotros
        </p>
      </div>
    </div>
  );
}