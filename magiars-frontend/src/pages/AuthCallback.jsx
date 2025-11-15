// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener el 'code' de los parámetros de URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorParam = params.get("error");

        if (errorParam) {
          setError(`Error de Meta: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError("No se recibió código de autenticación");
          setLoading(false);
          return;
        }

        // Enviar el code al backend
        const response = await api.metaCallback(code);

        if (response.success && response.token) {
          // Guardar token y datos del usuario
          localStorage.setItem("authToken", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("metaAccessToken", response.accessToken);

          // Redirigir al inicio
          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          setError("Error al procesar la autenticación");
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Error al autenticar: " + err.message);
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        {loading && !error && (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
                animation: "spin 1s linear infinite",
              }}
            >
              ⏳
            </div>
            <h2>Autenticando...</h2>
            <p style={{ color: "#666" }}>Por favor espera mientras procesamos tu login</p>
          </>
        )}

        {error && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
            <h2>Error en la autenticación</h2>
            <p style={{ color: "#c33" }}>{error}</p>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Volver al inicio
            </button>
          </>
        )}

        {!loading && !error && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
            <h2>¡Autenticación exitosa!</h2>
            <p style={{ color: "#666" }}>Redirigiendo...</p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}