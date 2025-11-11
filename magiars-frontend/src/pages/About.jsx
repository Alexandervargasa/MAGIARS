// src/pages/About.jsx
import React from "react";
import FAQ from "../components/FAQ";

function About() {
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroIcon}>🌟</div>
        <h1 style={styles.heroTitle}>Acerca de MAGIARS</h1>
        <p style={styles.heroSubtitle}>
          Tu chatbot inteligente para automatizar redes sociales
        </p>
      </section>

      {/* Main Content */}
      <section style={styles.contentSection}>
        <div style={styles.descriptionBox}>
          {/* Qué es MAGIARS */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>¿Qué es MAGIARS?</h2>
            <p style={styles.text}>
              MAGIARS es una plataforma integral de chatbot basada en inteligencia
              artificial diseñada para empresas que gestionan redes sociales como
              Instagram, Facebook y Twitter.
            </p>
          </div>

          {/* Características */}
          <div style={styles.section}>
            <h3 style={styles.subsectionTitle}>✨ Características principales</h3>
            <div style={styles.featuresList}>
              {[
                {
                  icon: "🤖",
                  title: "Automatización Inteligente",
                  description: "Responde mensajes directos y comentarios automáticamente usando IA avanzada."
                },
                {
                  icon: "📊",
                  title: "Análisis en Tiempo Real",
                  description: "Monitorea estadísticas de publicaciones y engagement de tus redes."
                },
                {
                  icon: "🚨",
                  title: "Escalada a Humanos",
                  description: "Si el chatbot no puede resolver, transfiere la conversación a tu equipo."
                },
                {
                  icon: "📜",
                  title: "Historial Completo",
                  description: "Revisa todas las conversaciones y acciones realizadas."
                },
                {
                  icon: "🔗",
                  title: "Múltiples Integraciones",
                  description: "Gestiona todas tus redes desde una sola plataforma."
                },
                {
                  icon: "📈",
                  title: "Informes Personalizados",
                  description: "Obtén métricas clave para optimizar tu estrategia de marketing."
                }
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  style={{
                    ...styles.featureCard,
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div style={styles.featureIcon}>{feature.icon}</div>
                  <div style={styles.featureContent}>
                    <strong style={styles.featureTitle}>{feature.title}</strong>
                    <p style={styles.featureDescription}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por qué elegir */}
          <div style={styles.section}>
            <h3 style={styles.subsectionTitle}>💡 ¿Por qué elegir MAGIARS?</h3>
            <div style={styles.whyBox}>
              <p style={styles.text}>
                En lugar de usar múltiples plataformas fragmentadas, MAGIARS
                combina comunicación automatizada, análisis avanzado y gestión de
                casos en una sola solución escalable y orientada a resultados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={styles.faqSection}>
        <FAQ />
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '0',
    animation: 'fadeIn 0.8s ease-out',
  },

  // HERO SECTION
  heroSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '80px 20px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  heroIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    animation: 'float 3s ease-in-out infinite',
  },

  heroTitle: {
    fontSize: '48px',
    marginBottom: '15px',
    fontWeight: '700',
    textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },

  heroSubtitle: {
    fontSize: '20px',
    opacity: 0.95,
    fontWeight: '300',
    maxWidth: '600px',
    margin: '0 auto',
  },

  // CONTENT SECTION
  contentSection: {
    maxWidth: '1100px',
    margin: '60px auto',
    padding: '0 20px',
  },

  descriptionBox: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    padding: '50px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  section: {
    marginBottom: '50px',
  },

  sectionTitle: {
    fontSize: '32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '20px',
    fontWeight: '700',
  },

  subsectionTitle: {
    fontSize: '24px',
    color: '#fff',
    marginBottom: '25px',
    fontWeight: '600',
  },

  text: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: '1.8',
    marginBottom: '15px',
  },

  // FEATURES LIST
  featuresList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },

  featureCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '15px',
    padding: '20px',
    display: 'flex',
    gap: '15px',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.6s ease-out',
  },

  featureIcon: {
    fontSize: '36px',
    flexShrink: 0,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    color: '#fff',
    fontSize: '16px',
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
  },

  featureDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },

  // WHY BOX
  whyBox: {
    background: 'rgba(102, 126, 234, 0.1)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '15px',
    padding: '25px',
  },

  // FAQ SECTION
  faqSection: {
    maxWidth: '1100px',
    margin: '0 auto 60px',
    padding: '0 20px',
  },
};

export default About;