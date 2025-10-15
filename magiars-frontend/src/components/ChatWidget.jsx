// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../services/api.js";

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy el asistente de MAGIARS 🤖, tu chatbot inteligente para Instagram. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [conversationId, setConversationId] = useState("");
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationCategory, setConversationCategory] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isOutOfHours, setIsOutOfHours] = useState(false);
  const messagesEndRef = useRef(null);

  // Obtener userId al cargar
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "Usuario");
        setUserId(user.id);
      } catch (e) {
        console.error("Error parsing user:", e);
        setUserName("Usuario");
      }
    }
  }, []);

  // Cargar historial de conversaciones cuando tenemos userId
  useEffect(() => {
    if (userId) {
      loadChatHistory();
    }
  }, [userId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeNewChat = () => {
    const newConvId = "conv-" + Date.now();
    setConversationId(newConvId);
    setConversationTitle("Nuevo Chat");
    setConversationCategory(null);
    setMessages([
      { from: "bot", text: "¡Hola! Soy el asistente de MAGIARS 🤖. ¿En qué puedo ayudarte?" },
    ]);
    setEscalated(false);
    setInput("");
  };

  const loadChatHistory = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const conversations = await api.getConversations(userId);
      
      // Mapear conversaciones con formato adecuado
      const formattedHistory = conversations.map(conv => ({
        id: conv.conversationId,
        title: conv.title || "Chat sin título",
        category: conv.category,
        timestamp: conv.updatedAt || conv.createdAt,
        // No cargamos mensajes aquí, solo metadata
      }));

      setChatHistory(formattedHistory);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setIsLoading(false);
    }
  };

const loadChat = async (chat) => {
  if (!chat.id) return;

  try {
    setIsLoading(true);
    
    // Cargar mensajes de esta conversación desde el backend
    const messagesData = await api.getConversationMessages(chat.id);
    
    // Formatear mensajes para el componente
    let formattedMessages = [];
    
    if (messagesData.length === 0) {
      // Si no hay mensajes guardados, mostrar solo el mensaje de bienvenida
      formattedMessages = [
        { from: "bot", text: "¡Hola! Soy el asistente de MAGIARS 🤖." }
      ];
    } else {
      // Si hay mensajes, cargarlos (sin duplicar el mensaje de bienvenida)
      formattedMessages = [
        { from: "bot", text: "¡Hola! Soy el asistente de MAGIARS 🤖." },
        ...messagesData.map(msg => ({
          from: msg.role === "user" ? "user" : "bot",
          text: msg.content,
        }))
      ];
    }

    setConversationId(chat.id);
    setConversationTitle(chat.title);
    setConversationCategory(chat.category);
    setMessages(formattedMessages);
    setEscalated(false);
    
    console.log(`✅ Conversación cargada: ${chat.id} con ${messagesData.length} mensajes`);
  } catch (error) {
    console.error("Error cargando conversación:", error);
    
    // Si falla la carga, mostrar la conversación vacía pero funcional
    setConversationId(chat.id);
    setConversationTitle(chat.title);
    setConversationCategory(chat.category);
    setMessages([
      { from: "bot", text: "¡Hola! Soy el asistente de MAGIARS 🤖." },
    ]);
    setEscalated(false);
    
    console.log(`⚠️ Conversación ${chat.id} cargada sin mensajes (posiblemente nueva)`);
  } finally {
    setIsLoading(false);
  }
};

  const deleteChat = async (chatId) => {
    try {
      // Mostrar confirmación
      if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
        return;
      }

      // Eliminar de la base de datos
      await api.deleteConversation(chatId);
      
      // Eliminar del estado local
      const updated = chatHistory.filter(c => c.id !== chatId);
      setChatHistory(updated);
      
      // Si es la conversación actual, iniciar nueva
      if (conversationId === chatId) {
        initializeNewChat();
      }

      console.log(`✅ Conversación ${chatId} eliminada correctamente`);
    } catch (error) {
      console.error("❌ Error eliminando chat:", error);
      alert("Error al eliminar la conversación. Por favor, intenta de nuevo.");
    }
  };

  const push = (m) => setMessages((prev) => [...prev, m]);

  const handleSend = async () => {
  if (!input.trim() || !userId) return;

  const userMessage = input;
  const isFirstMessage = messages.length === 1; // Solo mensaje de bienvenida
  
  push({ from: "user", text: userMessage });
  setInput("");

  // Mostrar "Procesando..."
  push({ from: "bot", text: "⏳ Procesando..." });

  try {
    // Construir historial para mantener contexto (sin mensaje de bienvenida)
    const conversationHistory = messages
      .filter(m => 
        m.text !== "⏳ Procesando..." && 
        !m.text.includes("¡Hola! Soy el asistente de MAGIARS")
      )
      .map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text
      }));

    // Llamar al backend
    const response = await api.sendMessage(
      userMessage, 
      userId, 
      conversationId, 
      conversationHistory,
      isFirstMessage
    );

    // Remover "Procesando..."
    setMessages(prev => prev.slice(0, -1));

    // Verificar si estamos fuera de horario
    if (response.outOfHours) {
      push({ from: "bot", text: response.reply });
      setIsOutOfHours(true);
      return;
    }

    // Verificar si quiere valorar
    if (response.showRating) {
      push({ from: "bot", text: response.reply });
      setShowRatingModal(true);
      return;
    }

    // Verificar escalación
    if (response.requiresEscalation) {
      push({ from: "bot", text: response.reply });
      
      try {
        const payload = {
          userId: userId,
          conversationId: conversationId,
          priority: "high",
          issue: userMessage,
        };
        await api.createEscalation(payload);
        setEscalated(true);
      } catch (e) {
        console.error("Error al escalar:", e);
      }
    } else {
      // Mostrar respuesta
      push({ from: "bot", text: response.reply });
      
      // Actualizar título si es primer mensaje
      if (isFirstMessage && response.title) {
        setConversationTitle(response.title);
        
        // Actualizar o agregar al historial
        setChatHistory(prev => {
          const exists = prev.find(c => c.id === conversationId);
          if (exists) {
            // Actualizar conversación existente
            return prev.map(c => 
              c.id === conversationId 
                ? { ...c, title: response.title, timestamp: new Date().toISOString() }
                : c
            );
          } else {
            // Agregar nueva conversación al inicio
            return [{
              id: conversationId,
              title: response.title,
              category: response.category || null,
              timestamp: new Date().toISOString(),
            }, ...prev];
          }
        });
        
        console.log(`✅ Conversación "${response.title}" agregada al historial`);
      }
      
      // Actualizar categoría si viene
      if (response.category) {
        setConversationCategory(response.category);
        
        setChatHistory(prev => 
          prev.map(c => 
            c.id === conversationId 
              ? { ...c, category: response.category, timestamp: new Date().toISOString() }
              : c
          )
        );
        
        console.log(`✅ Categoría "${response.category}" asignada`);
      }

      // Si hay un nuevo conversationId (primera vez)
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }
    }
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    
    // Remover "Procesando..."
    setMessages(prev => prev.slice(0, -1));
    
    push({ 
      from: "bot", 
      text: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo." 
    });
  }
};

  const handleManualEscalation = async () => {
    // Verificar si estamos fuera de horario
    if (isOutOfHours) {
      push({ from: "bot", text: "Lo siento, no es posible escalar casos fuera de nuestro horario de atención." });
      return;
    }

    if (!userId) return;

    try {
      const payload = {
        userId: userId,
        conversationId: conversationId,
        priority: "high",
        issue: "Escalación manual del usuario",
      };
      await api.createEscalation(payload);
      push({ from: "bot", text: "✅ Tu caso ha sido escalado. Un agente humano se pondrá en contacto contigo pronto." });
      setEscalated(true);
    } catch (error) {
      console.error("Error al escalar:", error);
      push({ from: "bot", text: "❌ Error al escalar. Por favor, intenta de nuevo." });
    }
  };

  // Manejar valoración
  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      alert("Por favor selecciona una calificación");
      return;
    }

    try {
      await api.submitRating(conversationId, userId, selectedRating, ratingComment);
      
      push({ 
        from: "bot", 
        text: `¡Gracias por tu valoración de ${selectedRating} ${selectedRating === 1 ? 'estrella' : 'estrellas'}! Tu opinión es muy importante para nosotros. 😊` 
      });
      
      setShowRatingModal(false);
      setSelectedRating(0);
      setRatingComment("");
    } catch (e) {
      console.error("Error al enviar valoración:", e);
      alert("Error al enviar la valoración");
    }
  };

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
        overflow: showSidebar ? 'visible' : 'hidden',
      }}>
        <button 
          onClick={initializeNewChat} 
          style={styles.newChatButton}
        >
          ➕ Nuevo Chat
        </button>

        <div style={styles.historyLabel}>
          Historial {chatHistory.length > 0 && `(${chatHistory.length})`}
        </div>

        <div style={styles.historyList}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
              Cargando...
            </div>
          ) : chatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px', fontSize: '13px' }}>
              No hay conversaciones aún
            </div>
          ) : (
            chatHistory.map((chat) => (
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
            ))
          )}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escribe tu mensaje..."
            style={styles.input}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend} 
            style={{
              ...styles.sendButton,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={isLoading}
          >
            →
          </button>
          <button 
            onClick={handleManualEscalation} 
            style={{
              ...styles.escalateButton,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={isLoading}
          >
            🚨 Escalar
          </button>
        </div>

        {/* Escalation Alert */}
        {escalated && (
          <div style={styles.escalationAlert}>
            ✅ Caso escalado a un agente humano
          </div>
        )}
      </div>

      {/* Alerta de fuera de horario */}
        {isOutOfHours && (
          <div style={{
            padding: '12px 20px',
            background: 'rgba(255, 152, 0, 0.2)',
            borderTop: '1px solid rgba(255, 152, 0, 0.3)',
            color: '#ff9800',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            ⏰ Fuera de horario de atención
          </div>
        )}

      {/* Modal de Valoración */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 12, 41, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            padding: '35px',
            borderRadius: '20px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'slideIn 0.3s ease-out',
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '25px', 
              textAlign: 'center',
              color: '#fff',
              fontSize: '22px',
              fontWeight: '600',
            }}>
              ¿Cómo fue tu experiencia?
            </h3>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '12px', 
              marginBottom: '25px',
              fontSize: '38px'
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  style={{
                    cursor: 'pointer',
                    color: star <= selectedRating ? '#ffc107' : 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                    filter: star <= selectedRating ? 'drop-shadow(0 0 10px #ffc107)' : 'none',
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia (opcional)"
              style={{
                width: '100%',
                minHeight: '90px',
                padding: '12px 15px',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                marginBottom: '20px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => e.target.style.border = '1px solid rgba(102, 126, 234, 0.6)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(102, 126, 234, 0.3)'}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                  setRatingComment("");
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(108, 117, 125, 0.3)',
                  color: '#fff',
                  border: '1px solid rgba(108, 117, 125, 0.5)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(108, 117, 125, 0.5)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(108, 117, 125, 0.3)'}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitRating}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
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