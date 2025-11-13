// src/pages/BusinessHours.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function BusinessHours() {
  const [config, setConfig] = useState({
    enabled: true,
    timezone: "America/Bogota",
    schedule: {
      monday: { open: "09:00", close: "18:00", enabled: true },
      tuesday: { open: "09:00", close: "18:00", enabled: true },
      wednesday: { open: "09:00", close: "18:00", enabled: true },
      thursday: { open: "09:00", close: "18:00", enabled: true },
      friday: { open: "09:00", close: "18:00", enabled: true },
      saturday: { open: "09:00", close: "14:00", enabled: true },
      sunday: { open: "00:00", close: "00:00", enabled: false },
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const dayNames = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.getBusinessHours();
      setConfig(data);
    } catch (e) {
      console.error("Error cargando configuración:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      await api.updateBusinessHours(config);
      setMessage("✅ Horarios guardados correctamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      console.error("Error guardando:", e);
      setMessage("❌ Error al guardar horarios");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day, field, value) => {
    setConfig(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>⏰ Configuración de Horarios de Atención</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Define los horarios en los que el chatbot estará disponible para atender consultas.
      </p>

      {/* Toggle general */}
      <div style={{
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "8px",
        marginBottom: "20px",
      }}>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            style={{ marginRight: "10px", width: "18px", height: "18px" }}
          />
          <span style={{ fontSize: "16px", fontWeight: "500" }}>
            Habilitar restricción por horarios
          </span>
        </label>
        <p style={{ margin: "10px 0 0 28px", fontSize: "14px", color: "#666" }}>
          {config.enabled 
            ? "El chatbot solo responderá durante los horarios configurados"
            : "El chatbot estará disponible 24/7"}
        </p>
      </div>

      {/* Configuración de días */}
      <div style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        {Object.keys(config.schedule).map((day, index) => (
          <div
            key={day}
            style={{
              padding: "15px 20px",
              borderBottom: index < 6 ? "1px solid #eee" : "none",
              background: config.schedule[day].enabled ? "white" : "#f8f9fa",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            {/* Checkbox del día */}
            <input
              type="checkbox"
              checked={config.schedule[day].enabled}
              onChange={(e) => updateDay(day, "enabled", e.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />

            {/* Nombre del día */}
            <div style={{ flex: "0 0 100px", fontWeight: "500" }}>
              {dayNames[day]}
            </div>

            {/* Horarios */}
            {config.schedule[day].enabled ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ fontSize: "14px", color: "#666" }}>Abre:</label>
                  <input
                    type="time"
                    value={config.schedule[day].open}
                    onChange={(e) => updateDay(day, "open", e.target.value)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ fontSize: "14px", color: "#666" }}>Cierra:</label>
                  <input
                    type="time"
                    value={config.schedule[day].close}
                    onChange={(e) => updateDay(day, "close", e.target.value)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </>
            ) : (
              <span style={{ color: "#999", fontSize: "14px" }}>Cerrado</span>
            )}
          </div>
        ))}
      </div>

      {/* Zona horaria */}
      <div style={{
        marginTop: "20px",
        padding: "15px",
        background: "#f8f9fa",
        borderRadius: "8px",
      }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Zona horaria:
        </label>
        <select
          value={config.timezone}
          onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          <option value="America/Bogota">Colombia (Bogotá)</option>
          <option value="America/New_York">USA - Este (New York)</option>
          <option value="America/Chicago">USA - Centro (Chicago)</option>
          <option value="America/Los_Angeles">USA - Pacífico (Los Angeles)</option>
          <option value="America/Mexico_City">México (Ciudad de México)</option>
          <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
          <option value="America/Santiago">Chile (Santiago)</option>
          <option value="Europe/Madrid">España (Madrid)</option>
        </select>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <div style={{
          marginTop: "20px",
          padding: "12px",
          background: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24",
          borderRadius: "6px",
          textAlign: "center",
        }}>
          {message}
        </div>
      )}

      {/* Botones */}
      <div style={{
        marginTop: "30px",
        display: "flex",
        gap: "10px",
        justifyContent: "flex-end",
      }}>
        <button
          onClick={loadConfig}
          disabled={saving}
          style={{
            padding: "10px 20px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 20px",
            background: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}