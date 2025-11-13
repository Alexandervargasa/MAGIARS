// src/pages/DataDeletion.jsx
import React, { useState } from "react";

export default function DataDeletion() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    reason: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // En producción, enviarías esto a tu backend
    console.log("Solicitud de eliminación de datos:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ email: "", reason: "" });
    }, 5000);
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>Eliminación de datos</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Si deseas que eliminemos todos tus datos de nuestra plataforma, completa
        este formulario y nos pondremos en contacto contigo.
      </p>

      {submitted ? (
        <div
          style={{
            background: "#d4edda",
            border: "1px solid #c3e6cb",
            color: "#155724",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <strong>✅ Solicitud recibida</strong>
          <p style={{ margin: "10px 0 0 0" }}>
            Hemos recibido tu solicitud. Procesaremos tu eliminación de datos
            dentro de 30 días según la política de privacidad.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Correo electrónico:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="reason"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Motivo de la solicitud (opcional):
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="5"
              placeholder="Cuéntanos por qué deseas eliminar tu cuenta..."
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#c82333")}
            onMouseLeave={(e) => (e.target.style.background = "#dc3545")}
          >
            Solicitar eliminación de datos
          </button>
        </form>
      )}

      <hr style={{ margin: "40px 0", borderColor: "#ddd" }} />

      <h2 style={{ fontSize: "18px", marginTop: "30px" }}>
        Información sobre eliminación de datos
      </h2>
      <ul style={{ color: "#666", lineHeight: "1.8" }}>
        <li>
          Procesaremos tu solicitud dentro de 30 días hábiles según la
          legislación vigente.
        </li>
        <li>Eliminaremos todos tus datos personales de nuestras bases de datos.</li>
        <li>
          Algunos datos pueden retenerse por obligaciones legales o fiscales.
        </li>
        <li>
          Recibirás una confirmación por correo electrónico una vez completado el
          proceso.
        </li>
      </ul>

      <p style={{ color: "#999", fontSize: "12px", marginTop: "30px" }}>
        Para más información, consulta nuestra{" "}
        <a href="/privacy" style={{ color: "#0066cc", textDecoration: "none" }}>
          política de privacidad
        </a>
        .
      </p>
    </div>
  );
}