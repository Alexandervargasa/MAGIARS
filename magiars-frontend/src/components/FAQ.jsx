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
      <h2 style={styles.title}>❓ Preguntas Frecuentes</h2>
      <div style={styles.faqList}>
        {faqs.map((faq) => (
          <div key={faq.id} style={styles.faqItem}>
            <button
              onClick={() => toggleFAQ(faq.id)}
              style={{
                ...styles.faqQuestion,
                backgroundColor:
                  openId === faq.id ? "#0066cc" : "#f5f5f5",
                color: openId === faq.id ? "#fff" : "#333",
              }}
            >
              <span style={styles.questionText}>{faq.question}</span>
              <span style={styles.icon}>
                {openId === faq.id ? "▼" : "▶"}
              </span>
            </button>
            {openId === faq.id && (
              <div style={styles.faqAnswer}>
                <p>{faq.answer}</p>
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
    maxWidth: "800px",
    margin: "40px auto",
    padding: "20px",
  },
  title: {
    fontSize: "28px",
    textAlign: "center",
    marginBottom: "30px",
    color: "#333",
  },
  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  faqItem: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  faqQuestion: {
    width: "100%",
    padding: "15px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
  },
  questionText: {
    textAlign: "left",
    flex: 1,
  },
  icon: {
    marginLeft: "10px",
    fontSize: "12px",
    transition: "transform 0.3s ease",
  },
  faqAnswer: {
    padding: "15px",
    backgroundColor: "#fafafa",
    borderTop: "1px solid #eee",
    lineHeight: "1.6",
    color: "#555",
  },
};

export default FAQ;