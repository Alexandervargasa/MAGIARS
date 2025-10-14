// src/components/FAQ.jsx
import React, { useState } from "react";

const faqs = [
  {
    id: 1,
    question: "¿Qué es MAGIARS?",
    answer:
      "MAGIARS es un chatbot inteligente basado en IA para gestionar automáticamente tus redes sociales (Instagram, Facebook, Twitter). Combina automatización de respuestas con análisis avanzado de métricas para potenciar tu estrategia de marketing digital.",
  },
  {
    id: 2,
    question: "¿Con qué redes sociales funciona MAGIARS?",
    answer:
      "MAGIARS se integra con Instagram, Facebook y Twitter. Puedes configurar tus integraciones en la sección de Integraciones y el chatbot atenderá mensajes directos y comentarios en todas estas plataformas.",
  },
  {
    id: 3,
    question: "¿Necesito conocimientos técnicos para usar MAGIARS?",
    answer:
      "No. MAGIARS está diseñado para ser intuitivo y fácil de usar. Solo necesitas iniciar sesión con Meta, configurar tus integraciones y comenzar a recibir respuestas automáticas de nuestro chatbot basado en IA.",
  },
  {
    id: 4,
    question: "¿Cómo funciona la escalada a un humano?",
    answer:
      "Si el chatbot no puede resolver una consulta, puede ser escalada a un agente humano. El cliente será atendido por tu equipo, y podrás mantener un histórico completo de la conversación en tu Inbox.",
  },
  {
    id: 5,
    question: "¿Puedo ver el historial de conversaciones?",
    answer:
      "Sí. MAGIARS mantiene un historial completo de todas las conversaciones con tus clientes. Puedes revisar cada interacción, ver qué preguntas se hicieron y cómo fueron resueltas.",
  },
  {
    id: 6,
    question: "¿Qué métricas me proporciona MAGIARS?",
    answer:
      "MAGIARS te proporciona análisis en tiempo real de tus publicaciones, incluyendo engagement, alcance, y estadísticas de desempeño. También genera informes personalizados con métricas clave para optimizar tu estrategia.",
  },
  {
    id: 7,
    question: "¿Es seguro compartir mis credenciales de redes sociales?",
    answer:
      "Sí. MAGIARS utiliza autenticación OAuth con Meta, lo que significa que nunca manejamos directamente tus contraseñas. Tus datos están protegidos con estándares de seguridad de nivel empresarial.",
  },
  {
    id: 8,
    question: "¿Puedo personalizar las respuestas del chatbot?",
    answer:
      "MAGIARS utiliza IA (Google Gemini) para generar respuestas contextuales e inteligentes. Las respuestas se adaptan al contexto de cada conversación para mantener una experiencia personalizada.",
  },
];

function FAQ() {
  const [openId, setOpenId] = useState(null);

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            max-height: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            max-height: 500px;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <h2 style={styles.title}>❓ Preguntas Frecuentes</h2>
      
      <div style={styles.faqList}>
        {faqs.map((faq, idx) => (
          <div 
            key={faq.id} 
            style={{
              ...styles.faqItem,
              animationDelay: `${idx * 0.05}s`
            }}
          >
            <button
              onClick={() => toggleFAQ(faq.id)}
              style={{
                ...styles.faqQuestion,
                background: openId === faq.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderLeft: openId === faq.id 
                  ? '3px solid #667eea'
                  : '3px solid transparent',
              }}
            >
              <span style={styles.questionIcon}>
                {openId === faq.id ? '❓' : '💬'}
              </span>
              <span style={styles.questionText}>{faq.question}</span>
              <span style={{
                ...styles.icon,
                transform: openId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▼
              </span>
            </button>
            
            {openId === faq.id && (
              <div style={styles.faqAnswer}>
                <p style={styles.answerText}>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0',
  },

  title: {
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: '700',
  },

  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  faqItem: {
    background: 'rgba(15, 12, 41, 0.6)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '15px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.5s ease-out',
  },

  faqQuestion: {
    width: '100%',
    padding: '18px 24px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    transition: 'all 0.3s ease',
    color: '#fff',
  },

  questionIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },

  questionText: {
    textAlign: 'left',
    flex: 1,
    fontSize: '15px',
  },

  icon: {
    fontSize: '12px',
    transition: 'transform 0.3s ease',
    flexShrink: 0,
    opacity: 0.7,
  },

  faqAnswer: {
    padding: '20px 24px 24px 24px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderTop: '1px solid rgba(102, 126, 234, 0.1)',
    animation: 'slideDown 0.3s ease-out',
  },

  answerText: {
    lineHeight: '1.7',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    margin: 0,
  },
};

export default FAQ;