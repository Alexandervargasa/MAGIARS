// src/components/ChatWidget.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api.js";

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy el asistente de MAGIARS 🤖, tu chatbot inteligente para Instagram. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [userName, setUserName] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationCategory, setConversationCategory] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);

  // Inicializar conversación al cargar
   useEffect(() => {
    initializeNewChat();
    loadChatHistory();
  }, []);

  // Obtener el nombre del usuario autenticado
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "Usuario");
      } catch (e) {
        console.error("Error parsing user:", e);
        setUserName("Usuario");
      }
    }
  }, []);

  const initializeNewChat = () => {
    const newConvId = "conv-" + Date.now();
    setConversationId(newConvId);
    setConversationTitle("");
    setConversationCategory(null);
    setMessages([
      { from: "bot", text: "¡Hola! Soy el bot de MAGIARS 🤖. Escribe tu mensaje." },
    ]);
    setEscalated(false);
    setInput("");
  };

  const loadChatHistory = () => {
    const history = localStorage.getItem("chatHistory");
    if (history) {
      try {
        setChatHistory(JSON.parse(history));
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  };

  const saveChatToHistory = () => {
    if (messages.length > 1 || conversationTitle) {
      const updatedHistory = chatHistory.filter(c => c.id !== conversationId);
      
      updatedHistory.unshift({
        id: conversationId,
        title: conversationTitle || "Chat sin título",
        messages: messages,
        category: conversationCategory,
        timestamp: new Date().toISOString(),
      });
      setChatHistory(updatedHistory.slice(0, 20));
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory.slice(0, 20)));
    }
  };

  const updateCurrentChatInHistory = (title, category) => {
    const existingChat = chatHistory.find(c => c.id === conversationId);
    
    if (existingChat) {
      // Actualizar chat existente
      const updatedHistory = chatHistory.map(chat => 
        chat.id === conversationId 
          ? { 
              ...chat, 
              title: title || chat.title,
              category: category || chat.category,
              messages: messages 
            }
          : chat
      );
      setChatHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    } else {
      // Crear nuevo chat en el historial
      const newChat = {
        id: conversationId,
        title: title || "Chat sin título",
        messages: messages,
        category: category || null,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [newChat, ...chatHistory].slice(0, 20);
      setChatHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    }
  };

  const loadChat = (chat) => {
    setConversationId(chat.id);
    setConversationTitle(chat.title);
    setConversationCategory(chat.category);
    setMessages(chat.messages);
    setEscalated(false);
  };

  const deleteChat = (chatId) => {
    const updated = chatHistory.filter(c => c.id !== chatId);
    setChatHistory(updated);
    localStorage.setItem("chatHistory", JSON.stringify(updated));
  };

  const push = (m) => setMessages((prev) => [...prev, m]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    const isFirstMessage = messages.length === 1; // Solo el mensaje de bienvenida
    
    push({ from: "user", text: userMessage });
    setInput("");

    // Mostrar "Procesando..."
    push({ from: "bot", text: "Procesando..." });

    try {
      const userStr = localStorage.getItem("user");
      const userId = userStr ? JSON.parse(userStr).id : null;

      // Construir historial de conversación para mantener contexto
      const conversationHistory = messages
        .filter(m => m.text !== "Procesando..." && m.text !== "¡Hola! Soy el bot de MAGIARS 🤖. Escribe tu mensaje.")
        .map(m => ({
          role: m.from === "user" ? "user" : "assistant",
          content: m.text
        }));

      // Llamar a la API con Gemini
      const response = await api.sendMessage(
        userMessage, 
        userId, 
        conversationId, 
        conversationHistory,
        isFirstMessage
      );

      console.log("📥 Respuesta recibida:", response);
      console.log("🆕 Es primer mensaje?", isFirstMessage);
      console.log("📋 Título recibido:", response.title);

      // Remover el "Procesando..."
      setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return updated;
      });

      // Verificar si requiere escalación
      if (response.requiresEscalation) {
        push({ from: "bot", text: response.reply });
        
        // Crear la escalación automáticamente
        try {
          const payload = {
            channel: "instagram",
            userHandle: userName,
            conversationId: conversationId,
            message: userMessage,
          };
          const created = await api.createEscalation(payload);
          await api.alert({
            type: "escalation",
            id: created.id,
            at: new Date().toISOString(),
          });
          setEscalated(true);
        } catch (e) {
          console.error("Error al escalar:", e);
        }
      } else {
        // Mostrar respuesta de Gemini
        push({ from: "bot", text: response.reply });
        
        // Si es el primer mensaje y viene un título, usarlo
        if (isFirstMessage && response.title) {
          console.log("✅ Actualizando título a:", response.title);
          setConversationTitle(response.title);
          // Agregar inmediatamente al historial
          updateCurrentChatInHistory(response.title, null);
        }
        // Si viene una categoría, actualizar
        else if (response.category) {
          setConversationCategory(response.category);
          updateCurrentChatInHistory(conversationTitle, response.category);
        } else {
          // Actualizar solo los mensajes si no hay categoría nueva
          updateCurrentChatInHistory(null, null);
        }
      }
    } catch (e) {
      console.error("Error al enviar mensaje:", e);
      
      // Remover el "Procesando..."
      setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return updated;
      });
      
      push({ from: "bot", text: "Lo siento, hubo un error. Intenta de nuevo." });
    }
  };

  const handleManualEscalation = async () => {
    try {
      const payload = {
        channel: "instagram",
        userHandle: userName,
        conversationId: conversationId,
        message: "Escalada manual desde UI",
      };
      const created = await api.createEscalation(payload);
      await api.alert({
        type: "escalation",
        id: created.id,
        at: new Date().toISOString(),
      });
      push({ from: "bot", text: "Caso escalado manualmente." });
      setEscalated(true);
    } catch (e) {
      push({ from: "bot", text: "Error al escalar manualmente." });
    }
  };

  // Función para obtener color según categoría
  const getCategoryColor = (category) => {
    const colors = {
      "Soporte Técnico": "#e74c3c",
      "Consulta de Precios": "#3498db",
      "Problema de Cuenta": "#e67e22",
      "Integración": "#9b59b6",
      "Consulta General": "#95a5a6",
      "Escalación": "#c0392b",
      "Otro": "#7f8c8d",
    };
    return colors[category] || "#95a5a6";
  };

    return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: showSidebar ? '280px' : '0',
        padding: showSidebar ? '20px' : '0',
      }}>
        <button onClick={() => {
          saveChatToHistory();
          initializeNewChat();
        }} style={styles.newChatButton}>
          ➕ Nuevo Chat
        </button>

        <div style={styles.historyLabel}>Historial</div>

        <div style={styles.historyList}>
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat)}
              style={{
                ...styles.historyItem,
                background: conversationId === chat.id 
                  ? 'rgba(102, 126, 234, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={styles.historyItemHeader}>
                <span style={styles.historyItemTitle}>
                  {chat.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  style={styles.deleteButton}
                >
                  ✕
                </button>
              </div>
              {chat.category && (
                <span style={{
                  ...styles.categoryBadge,
                  background: getCategoryColor(chat.category),
                }}>
                  {chat.category}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div style={styles.mainChat}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => setShowSidebar(!showSidebar)} style={styles.toggleButton}>
            ☰
          </button>
          <div style={styles.headerInfo}>
            <h3 style={styles.headerTitle}>
              {conversationTitle || "Nuevo Chat"}
            </h3>
            {conversationCategory && (
              <span style={{
                ...styles.categoryBadge,
                background: getCategoryColor(conversationCategory),
                marginTop: '6px',
              }}>
                {conversationCategory}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messagesArea}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.from === 'user' ? 'right' : 'left',
                margin: '12px 0',
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              <div style={{
                ...styles.messageBubble,
                background: m.from === 'user' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: m.from === 'user' ? '#fff' : '#e0e0e0',
                border: m.from === 'user' 
                  ? '1px solid rgba(102, 126, 234, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu mensaje..."
            style={styles.input}
          />
          <button onClick={handleSend} style={styles.sendButton}>
            →
          </button>
          <button onClick={handleManualEscalation} style={styles.escalateButton}>
            🚨 Escalar
          </button>
        </div>

        {/* Escalation Alert */}
        {escalated && (
          <div style={styles.escalationAlert}>
            ✅ Caso escalado (revisa Bandeja)
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '15px',
    height: '700px',
    maxWidth: '1400px',
    margin: '0 auto',
  },

  // SIDEBAR
  sidebar: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '15px',
    overflowY: 'auto',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },

  newChatButton: {
    width: '100%',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },

  historyLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },

  historyList: {
    flex: 1,
    overflowY: 'auto',
  },

  historyItem: {
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(102, 126, 234, 0.1)',
  },

  historyItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },

  historyItemTitle: {
    fontSize: '13px',
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },

  deleteButton: {
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.4)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: '8px',
    transition: 'color 0.2s ease',
  },

  categoryBadge: {
    fontSize: '10px',
    padding: '4px 10px',
    borderRadius: '6px',
    display: 'inline-block',
    color: '#fff',
    fontWeight: '600',
  },

  // MAIN CHAT
  mainChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  header: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(15, 12, 41, 0.5)',
  },

  toggleButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#fff',
    fontWeight: '600',
  },

  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },

  messageBubble: {
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: '18px',
    maxWidth: '70%',
    wordWrap: 'break-word',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  },

  inputArea: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid rgba(102, 126, 234, 0.2)',
    background: 'rgba(15, 12, 41, 0.5)',
  },

  input: {
    flex: 1,
    padding: '12px 20px',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '25px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },

  sendButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '25px',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
  },

  escalateButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
    border: 'none',
    borderRadius: '25px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },

  escalationAlert: {
    padding: '12px 20px',
    background: 'rgba(76, 175, 80, 0.2)',
    borderTop: '1px solid rgba(76, 175, 80, 0.3)',
    color: '#4caf50',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },
};