// src/components/UserProfile.jsx
import React from "react";
import api from "../services/api.js";

export default function UserProfile({ user, onLogout }) {
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        padding: "10px 15px",
        background: "#f5f5f5",
        borderRadius: "8px",
        marginTop: "20px",
      }}
    >
      {user.avatar && (
        <img
          src={user.avatar}
          alt={user.name}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      )}

      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: "#333" }}>
          {user.name || "Usuario"}
        </p>
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: "8px 16px",
          background: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onMouseEnter={(e) => (e.target.style.background = "#c0392b")}
        onMouseLeave={(e) => (e.target.style.background = "#e74c3c")}
      >
        Cerrar sesión
      </button>
    </div>
  );
}