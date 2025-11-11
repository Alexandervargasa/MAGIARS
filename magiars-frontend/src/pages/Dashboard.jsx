// src/pages/Dashboard.jsx
import React from "react";
import ChatWidget from "../components/ChatWidget.jsx";

export default function Dashboard() {
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard del Chatbot</h1>
        <p style={styles.subtitle}>
          Gestiona tus conversaciones y prueba el asistente inteligente
        </p>
      </div>

      {/* Chat Widget */}
      <div style={styles.chatSection}>
        <ChatWidget />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '1400px',
    margin: '0 auto',
    animation: 'fadeIn 0.6s ease-out',
  },

  header: {
    textAlign: 'center',
    marginBottom: '40px',
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

  chatSection: {
    width: '100%',
  },
};