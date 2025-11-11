// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [mensaje, setMensaje] = useState("Cargando...");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:4000/")
      .then((res) => res.json())
      .then((data) => setMensaje(data.message))
      .catch(() => setMensaje("Error al conectar con el backend"));
  }, []);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.7); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>✨ MAGIARS</h1>
        </div>
        
        <h2 style={styles.mainTitle}>
          Tu Asistente Inteligente para Redes Sociales
        </h2>
        
        <p style={styles.description}>
          Automatiza, analiza y optimiza tu presencia digital con inteligencia artificial
        </p>

        {/* CTA Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          style={styles.ctaButton}
        >
          Ir al Dashboard →
        </button>

        {/* Backend Status */}
        <div style={styles.statusCard}>
          <div style={styles.statusIcon}>
            {mensaje.includes("Error") ? "⚠️" : "✅"}
          </div>
          <div style={styles.statusInfo}>
            <span style={styles.statusLabel}>Estado del Backend</span>
            <span style={{
              ...styles.statusMessage,
              color: mensaje.includes("Error") ? "#ff6b6b" : "#4caf50"
            }}>
              {mensaje}
            </span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={styles.featuresSection}>
        <h3 style={styles.sectionTitle}>Características Principales</h3>
        
        <div style={styles.featuresGrid}>
          {[
            {
              icon: "🤖",
              title: "IA Avanzada",
              description: "Respuestas inteligentes con Gemini AI",
              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            },
            {
              icon: "📊",
              title: "Análisis en Tiempo Real",
              description: "Monitorea tus métricas y rendimiento",
              gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            },
            {
              icon: "🔗",
              title: "Multi-Plataforma",
              description: "Instagram, Facebook, Twitter integrados",
              gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            },
            {
              icon: "⚡",
              title: "Escalación Automática",
              description: "Sistema inteligente de soporte",
              gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            }
          ].map((feature, idx) => (
            <div 
              key={idx}
              style={{
                ...styles.featureCard,
                animationDelay: `${idx * 0.15}s`
              }}
            >
              <div style={{
                ...styles.featureIconContainer,
                background: feature.gradient
              }}>
                <span style={styles.featureIcon}>{feature.icon}</span>
              </div>
              <h4 style={styles.featureTitle}>{feature.title}</h4>
              <p style={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Business Hours Section - NUEVO */}
      <div style={styles.scheduleSection}>
        <div style={styles.scheduleCard}>
          <div style={styles.scheduleHeader}>
            <span style={styles.scheduleIcon}>🕐</span>
            <h3 style={styles.scheduleTitle}>Horario de Atención</h3>
          </div>
          
          <p style={styles.scheduleSubtitle}>
            Nuestro chatbot inteligente está disponible en los siguientes horarios:
          </p>

          <div style={styles.scheduleGrid}>
            <div style={styles.scheduleItem}>
              <div style={styles.scheduleDay}>
                <span style={styles.dayIcon}>📅</span>
                Lunes a Viernes
              </div>
              <div style={styles.scheduleTime}>
                9:00 AM - 6:00 PM
              </div>
            </div>

            <div style={styles.scheduleItem}>
              <div style={styles.scheduleDay}>
                <span style={styles.dayIcon}>📅</span>
                Sábados
              </div>
              <div style={styles.scheduleTime}>
                9:00 AM - 2:00 PM
              </div>
            </div>

            <div style={styles.scheduleItem}>
              <div style={styles.scheduleDay}>
                <span style={styles.dayIcon}>📅</span>
                Domingos
              </div>
              <div style={{
                ...styles.scheduleTime,
                color: '#ff6b6b'
              }}>
                Cerrado
              </div>
            </div>
          </div>

          <div style={styles.timezoneInfo}>
            <span style={styles.timezoneIcon}>🌎</span>
            Hora de Colombia (UTC-5)
          </div>

          <div style={styles.scheduleNote}>
            💡 Fuera de estos horarios, puedes dejar tu mensaje y te responderemos en cuanto estemos disponibles
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={styles.statsSection}>
        {[
          { number: "< 1s", label: "Tiempo de Respuesta", icon: "⚡" },
          { number: "99.9%", label: "Precisión IA", icon: "🎯" },
        ].map((stat, idx) => (
          <div key={idx} style={styles.statCard}>
            <div style={styles.statIcon}>{stat.icon}</div>
            <div style={styles.statNumber}>{stat.number}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },

  heroSection: {
    textAlign: 'center',
    padding: '60px 20px',
    animation: 'fadeIn 0.8s ease-out',
  },

  logoContainer: {
    marginBottom: '30px',
  },

  logo: {
    fontSize: '56px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    letterSpacing: '3px',
    animation: 'float 3s ease-in-out infinite',
  },

  mainTitle: {
    fontSize: '38px',
    color: '#fff',
    fontWeight: '700',
    marginBottom: '20px',
    lineHeight: '1.3',
  },

  description: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: '600px',
    margin: '0 auto 40px',
    lineHeight: '1.6',
  },

  ctaButton: {
    padding: '15px 40px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s ease',
    marginBottom: '40px',
    animation: 'glow 2s ease-in-out infinite',
  },

  statusCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px 30px',
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '50px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  statusIcon: {
    fontSize: '32px',
  },

  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '5px',
  },

  statusLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },

  statusMessage: {
    fontSize: '15px',
    fontWeight: '600',
  },

  featuresSection: {
    marginTop: '80px',
    marginBottom: '60px',
  },

  sectionTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '50px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '25px',
  },

  featureCard: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '20px',
    padding: '35px 25px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.6s ease-out',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  featureIconContainer: {
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },

  featureIcon: {
    fontSize: '32px',
  },

  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px',
  },

  featureDescription: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.6',
  },

  // NUEVOS ESTILOS PARA HORARIO
  scheduleSection: {
    marginTop: '80px',
    marginBottom: '80px',
    display: 'flex',
    justifyContent: 'center',
  },

  scheduleCard: {
    background: 'rgba(15, 12, 41, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '700px',
    width: '100%',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
    animation: 'fadeIn 0.8s ease-out',
  },

  scheduleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
  },

  scheduleIcon: {
    fontSize: '40px',
    animation: 'pulse 2s ease-in-out infinite',
  },

  scheduleTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
  },

  scheduleSubtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '15px',
    marginBottom: '30px',
    lineHeight: '1.6',
  },

  scheduleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '25px',
  },

  scheduleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 25px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '14px',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    transition: 'all 0.3s ease',
  },

  scheduleDay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },

  dayIcon: {
    fontSize: '20px',
  },

  scheduleTime: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#4caf50',
    letterSpacing: '0.5px',
  },

  timezoneInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(102, 126, 234, 0.1)',
    borderRadius: '10px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
  },

  timezoneIcon: {
    fontSize: '18px',
  },

  scheduleNote: {
    textAlign: 'center',
    padding: '15px',
    background: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    borderRadius: '10px',
    color: '#ffc107',
    fontSize: '13px',
    lineHeight: '1.5',
  },

  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '25px',
    marginTop: '60px',
  },

  statCard: {
    background: 'rgba(15, 12, 41, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '16px',
    padding: '30px',
    textAlign: 'center',
    animation: 'glow 3s ease-in-out infinite',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },

  statIcon: {
    fontSize: '32px',
  },

  statNumber: {
    fontSize: '40px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  statLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
};

export default Home;