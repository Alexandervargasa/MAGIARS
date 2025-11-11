// src/pages/Integrations.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸", color: "#E1306C" },
  { id: "facebook", name: "Facebook", icon: "👥", color: "#1877F2" },
  { id: "twitter", name: "Twitter", icon: "🐦", color: "#1DA1F2" }
];

export default function Integrations() {
  const [form, setForm] = useState({ 
    instagram: { token: "", webhook: "" }, 
    facebook: { token: "", webhook: "" }, 
    twitter: { token: "", webhook: "" } 
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getIntegrations();
        if (data) setForm(data);
      } catch (e) {
        console.error("No se pudieron cargar integraciones", e);
      }
    })();
  }, []);

  function update(pf, key, value) {
    setForm((s) => ({ ...s, [pf]: { ...s[pf], [key]: value } }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveIntegrations(form);
      alert("Integraciones guardadas");
    } catch (e) {
      console.error(e);
      alert("Error guardando integraciones");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await api.testIntegrations();
      setTestResult(res);
    } catch (e) {
      console.error(e);
      alert("Error probando integraciones");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🔗 Integraciones</h1>
        <p style={styles.subtitle}>Conecta tus plataformas de redes sociales</p>
      </div>

      {/* Cards Grid */}
      <div style={styles.grid}>
        {PLATFORMS.map((platform, idx) => (
          <div 
            key={platform.id} 
            style={{
              ...styles.card,
              animationDelay: `${idx * 0.1}s`
            }}
          >
            {/* Platform Header */}
            <div style={styles.cardHeader}>
              <div style={{
                ...styles.platformIcon,
                background: platform.color
              }}>
                {platform.icon}
              </div>
              <h3 style={styles.platformName}>{platform.name}</h3>
            </div>

            {/* Token Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>🔑 Token de Acceso</label>
              <input
                type="password"
                value={form[platform.id]?.token || ""}
                onChange={(e) => update(platform.id, "token", e.target.value)}
                placeholder="Ingresa tu token..."
                style={styles.input}
              />
            </div>

            {/* Webhook Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>🌐 Webhook URL</label>
              <input
                type="text"
                value={form[platform.id]?.webhook || ""}
                onChange={(e) => update(platform.id, "webhook", e.target.value)}
                placeholder="https://..."
                style={styles.input}
              />
            </div>

            {/* Status Badge */}
            <div style={styles.statusBadge}>
              {form[platform.id]?.token ? (
                <span style={styles.statusConnected}>✓ Configurado</span>
              ) : (
                <span style={styles.statusDisconnected}>○ Sin configurar</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button 
          onClick={save} 
          disabled={saving}
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "💾 Guardando..." : "💾 Guardar Configuración"}
        </button>
        
        <button 
          onClick={test} 
          disabled={testing}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            opacity: testing ? 0.6 : 1,
          }}
        >
          {testing ? "🔄 Probando..." : "🧪 Probar Conexiones"}
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <div style={styles.resultsContainer}>
          <h3 style={styles.resultsTitle}>📊 Resultados de Prueba</h3>
          <div style={styles.resultsList}>
            {Object.entries(testResult).map(([platform, result]) => (
              <div key={platform} style={styles.resultItem}>
                <div style={styles.resultPlatform}>
                  <span style={styles.resultIcon}>
                    {PLATFORMS.find(p => p.id === platform)?.icon}
                  </span>
                  <span style={styles.resultName}>
                    {PLATFORMS.find(p => p.id === platform)?.name}
                  </span>
                </div>
                <div style={styles.resultStatus}>
                  <span style={result.ok ? styles.resultOk : styles.resultError}>
                    {result.ok ? "✓ Conectado" : "✗ Error"}
                  </span>
                  <span style={styles.resultDetails}>{result.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '1400px',
    margin: '0 auto',
    animation: 'fadeIn 0.6s ease-in',
  },

  header: {
    textAlign: 'center',
    marginBottom: '50px',
  },

  title: {
    fontSize: '42px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 15px 0',
    letterSpacing: '1px',
  },

  subtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: 0,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '25px',
    marginBottom: '40px',
  },

  card: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '20px',
    padding: '30px',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.6s ease-out',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px',
  },

  platformIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },

  platformName: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },

  inputGroup: {
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px',
    fontWeight: '500',
  },

  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },

  statusBadge: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(102, 126, 234, 0.2)',
  },

  statusConnected: {
    color: '#4caf50',
    fontSize: '13px',
    fontWeight: '600',
  },

  statusDisconnected: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '13px',
    fontWeight: '600',
  },

  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  button: {
    padding: '14px 35px',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  buttonPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },

  buttonSecondary: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(102, 126, 234, 0.3)',
  },

  resultsContainer: {
    marginTop: '50px',
    background: 'rgba(15, 12, 41, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '20px',
    padding: '30px',
  },

  resultsTitle: {
    fontSize: '24px',
    color: '#fff',
    marginBottom: '25px',
    fontWeight: '600',
  },

  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(102, 126, 234, 0.1)',
  },

  resultPlatform: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  resultIcon: {
    fontSize: '24px',
  },

  resultName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },

  resultStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '5px',
  },

  resultOk: {
    color: '#4caf50',
    fontSize: '14px',
    fontWeight: '600',
  },

  resultError: {
    color: '#ff6b6b',
    fontSize: '14px',
    fontWeight: '600',
  },

  resultDetails: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
};