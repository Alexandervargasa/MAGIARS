// src/components/ChatWidget.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api.js";

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy el bot de MAGIARS 🤖. Escribe tu mensaje." },
  ]);
  const [input, setInput] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [userName, setUserName] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [conversationTitle, setConversationTitle] = useState("");
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
        timestamp: new Date().toISOString(),
      });
      setChatHistory(updatedHistory.slice(0, 20)); // Guardar solo los últimos 20
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory.slice(0, 20)));
    }
  };

  const loadChat = (chat) => {
    setConversationId(chat.id);
    setConversationTitle(chat.title);
    setMessages(chat.messages);
  };

  const deleteChat = (chatId) => {
    const updated = chatHistory.filter(c => c.id !== chatId);
    setChatHistory(updated);
    localStorage.setItem("chatHistory", JSON.stringify(updated));
  };

  const push = (m) => setMessages((prev) => [...prev, m]);

  const getBotReply = (userMsg) => {
    const lower = userMsg.toLowerCase();
    if (lower.includes("humano") || lower.includes("asesor") || lower.includes("persona")) {
      return { type: "escalate" };
    }
    return {
      type: "auto",
      text: "Soy un bot demo. Escribe 'humano' si deseas hablar con una persona.",
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    push({ from: "user", text: input });
    push({ from: "bot", text: "Procesando..." });

    // Generar título si es el primer mensaje
    if (messages.length <= 1 && !conversationTitle) {
      setConversationTitle(input.substring(0, 30) + (input.length > 30 ? "..." : ""));
    }

    const reply = getBotReply(input);

    if (reply.type === "escalate") {
      try {
        const payload = {
          channel: "instagram",
          userHandle: userName,
          conversationId: conversationId,
          message: input,
        };
        const created = await api.createEscalation(payload);
        await api.alert({
          type: "escalation",
          id: created.id,
          at: new Date().toISOString(),
        });

        push({
          from: "bot",
          text: "He escalado tu caso a un humano. Pronto te responderán.",
        });
        setEscalated(true);
      } catch (e) {
        push({ from: "bot", text: "Error al escalar. Intenta de nuevo más tarde." });
        console.error("Escalation error", e);
      }
    } else {
      const userStr = localStorage.getItem("user");
      const userId = userStr ? JSON.parse(userStr).id : null;

      setTimeout(async () => {
        try {
          if (userId) {
            await api.sendMessage(input, userId, conversationId);
          }
          // Remover el mensaje "Procesando..."
          setMessages(prev => {
            const updated = [...prev];
            updated.pop();
            return updated;
          });
          push({ from: "bot", text: reply.text });
        } catch (e) {
          console.error("Error al guardar mensaje:", e);
          push({ from: "bot", text: reply.text });
        }
      }, 600);
    }

    setInput("");
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (conversationId !== chat.id) e.currentTarget.style.background = "#222";
            }}
            onMouseLeave={(e) => {
              if (conversationId !== chat.id) e.currentTarget.style.background = "transparent";
            }}
          >
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
              }}
            >
              ✕
            </button>
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
          <h3 style={{ margin: 0, flex: 1 }}>
            {conversationTitle || "Nuevo Chat"}
          </h3>
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