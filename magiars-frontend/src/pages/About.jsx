import React from "react";
import FAQ from "../components/FAQ";

function About() {
  return (
    <div style={styles.container}>
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>🌐 Acerca de MAGIARS</h1>
        <p style={styles.heroSubtitle}>
          Tu chatbot inteligente para automatizar redes sociales
        </p>
      </section>

      <section style={styles.contentSection}>
        <div style={styles.descriptionBox}>
          <h2 style={styles.sectionTitle}>¿Qué es MAGIARS?</h2>
          <p style={styles.text}>
            MAGIARS es una plataforma integral de chatbot basada en inteligencia
            artificial diseñada para empresas que gestionan redes sociales como
            Instagram, Facebook y Twitter.
          </p>

          <h3 style={styles.subsectionTitle}>Características principales:</h3>
          <ul style={styles.featureList}>
            <li style={styles.listItem}>
              <strong>Automatización Inteligente:</strong> Responde mensajes
              directos y comentarios automáticamente usando IA avanzada.
            </li>
            <li style={styles.listItem}>
              <strong>Análisis en Tiempo Real:</strong> Monitorea estadísticas
              de publicaciones y engagement de tus redes.
            </li>
            <li style={styles.listItem}>
              <strong>Escalada a Humanos:</strong> Si el chatbot no puede
              resolver, transfiere la conversación a tu equipo.
            </li>
            <li style={styles.listItem}>
              <strong>Historial Completo:</strong> Revisa todas las
              conversaciones y acciones realizadas.
            </li>
            <li style={styles.listItem}>
              <strong>Múltiples Integraciones:</strong> Gestiona todas tus redes
              desde una sola plataforma.
            </li>
            <li style={styles.listItem}>
              <strong>Informes Personalizados:</strong> Obtén métricas clave
              para optimizar tu estrategia de marketing.
            </li>
          </ul>

          <h3 style={styles.subsectionTitle}>¿Por qué elegir MAGIARS?</h3>
          <p style={styles.text}>
            En lugar de usar múltiples plataformas fragmentadas, MAGIARS
            combina comunicación automatizada, análisis avanzado y gestión de
            casos en una sola solución escalable y orientada a resultados.
          </p>
        </div>
      </section>

      <FAQ />
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f9f9f9",
    padding: "0",
  },
  heroSection: {
    backgroundColor: "#0066cc",
    color: "#fff",
    padding: "60px 20px",
    textAlign: "center",
  },
  heroTitle: {
    fontSize: "36px",
    marginBottom: "10px",
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: "18px",
    opacity: 0.9,
  },
  contentSection: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "0 20px",
  },
  descriptionBox: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "24px",
    color: "#0066cc",
    marginBottom: "15px",
    fontWeight: "600",
  },
  subsectionTitle: {
    fontSize: "18px",
    color: "#333",
    marginTop: "25px",
    marginBottom: "12px",
    fontWeight: "600",
  },
  text: {
    fontSize: "16px",
    color: "#555",
    lineHeight: "1.7",
    marginBottom: "15px",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    marginBottom: "20px",
  },
  listItem: {
    fontSize: "15px",
    color: "#555",
    lineHeight: "1.8",
    marginBottom: "12px",
    paddingLeft: "15px",
    borderLeft: "3px solid #0066cc",
  },
};

export default About;