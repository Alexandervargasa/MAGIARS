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
    <div style={{ display: "flex", gap: "10px", height: "600px" }}>
      {/* Sidebar */}
      <div
        style={{
          width: showSidebar ? "250px" : "0",
          background: "#1a1a1a",
          color: "white",
          padding: showSidebar ? "15px" : "0",
          overflowY: "auto",
          transition: "width 0.3s",
          borderRight: "1px solid #333",
        }}
      >
        <button
          onClick={() => {
            saveChatToHistory();
            initializeNewChat();
          }}
          style={{
            width: "100%",
            padding: "10px",
            background: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            marginBottom: "15px",
            cursor: "pointer",
          }}
        >
          ➕ Nuevo Chat
        </button>

        <div style={{ fontSize: "12px", color: "#999", marginBottom: "10px" }}>
          Historial
        </div>

        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            onClick={() => loadChat(chat)}
            style={{
              padding: "10px",
              background: conversationId === chat.id ? "#333" : "transparent",
              borderRadius: "6px",
              marginBottom: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (conversationId !== chat.id) e.currentTarget.style.background = "#222";
            }}
            onMouseLeave={(e) => {
              if (conversationId !== chat.id) e.currentTarget.style.background = "transparent";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: chat.category ? "6px" : "0" }}>
              <span style={{ fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                {chat.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                style={{
                  background: "transparent",
                  color: "#999",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  marginLeft: "8px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            {chat.category && (
              <span style={{
                fontSize: "10px",
                padding: "3px 8px",
                background: getCategoryColor(chat.category),
                borderRadius: "4px",
                display: "inline-block",
                color: "#fff",
              }}>
                {chat.category}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "10px", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>
              {conversationTitle || "Nuevo Chat"}
            </h3>
            {conversationCategory && (
              <span style={{
                fontSize: "11px",
                padding: "2px 8px",
                background: getCategoryColor(conversationCategory),
                borderRadius: "4px",
                color: "#fff",
                marginTop: "4px",
                display: "inline-block",
              }}>
                {conversationCategory}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
            background: "#fafafa",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.from === "user" ? "right" : "left",
                margin: "8px 0",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: m.from === "user" ? "#cfe9ff" : "#ececec",
                  maxWidth: "70%",
                  wordWrap: "break-word",
                }}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "12px", borderTop: "1px solid #ddd", display: "flex", gap: "8px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu mensaje..."
            style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
          <button onClick={handleSend} style={{ padding: "8px 16px", background: "#0066cc", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Enviar
          </button>
          <button onClick={handleManualEscalation} style={{ padding: "8px 16px", background: "#ff6b6b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Escalar
          </button>
        </div>

        {escalated && (
          <div style={{ padding: "8px 12px", background: "#fff3cd", color: "#856404", textAlign: "center", fontSize: "14px" }}>
            ✅ Caso escalado (revisa Bandeja)
          </div>
        )}
      </div>
    </div>
  );
}