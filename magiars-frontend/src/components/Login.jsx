// src/components/Login.jsx
import React, { useState } from "react";
import api from "../services/api.js";

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;

      if (isLogin) {
        // LOGIN
        response = await api.login(formData.email, formData.password);
      } else {
        // REGISTRO
        if (formData.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }

        response = await api.register(
          formData.name,
          formData.email,
          formData.password
        );
      }

      // Guardar token y usuario
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Notificar éxito
      onLoginSuccess(response.user);
    } catch (err) {
      console.error("Error de autenticación:", err);
      
      // Mejorar mensajes de error
      if (err.message.includes("409")) {
        setError("Este email ya está registrado");
      } else if (err.message.includes("401")) {
        setError("Email o contraseña incorrectos");
      } else if (err.message.includes("400")) {
        setError("Por favor completa todos los campos");
      } else {
        setError("Error al procesar la solicitud. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
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
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "8px",
            }}
          >
            🌐 MAGIARS
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Gestión inteligente de redes sociales
          </p>
        </div>

        {/* Toggle Login/Registro */}
        <div
          style={{
            display: "flex",
            background: "#f0f0f0",
            borderRadius: "8px",
            padding: "4px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
              setFormData({ name: "", email: "", password: "" });
            }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              background: isLogin ? "white" : "transparent",
              color: isLogin ? "#667eea" : "#666",
              fontWeight: isLogin ? "600" : "normal",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: isLogin ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
              setFormData({ name: "", email: "", password: "" });
            }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              background: !isLogin ? "white" : "transparent",
              color: !isLogin ? "#667eea" : "#666",
              fontWeight: !isLogin ? "600" : "normal",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: !isLogin ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#333",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Nombre completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required={!isLogin}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "border 0.3s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "border 0.3s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "border 0.3s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
            {!isLogin && (
              <p style={{ fontSize: "12px", color: "#999", marginTop: "6px" }}>
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "#fee",
                color: "#c33",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                border: "1px solid #fcc",
              }}
            >
              {error}
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, opacity 0.3s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
            }}
          >
            {loading
              ? "Procesando..."
              : isLogin
              ? "Iniciar Sesión"
              : "Crear Cuenta"}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#999",
            marginTop: "24px",
          }}
        >
          {isLogin
            ? "¿No tienes cuenta? "
            : "¿Ya tienes cuenta? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({ name: "", email: "", password: "" });
            }}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}