// src/components/ChatWidget.jsx
import React, { useState } from "react";
import api from "../services/api.js";

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy el bot de MAGIARS 🤖. Escribe tu mensaje." },
  ]);
  const [input, setInput] = useState("");
  const [escalated, setEscalated] = useState(false);

  const push = (m) => setMessages((prev) => [...prev, m]);

  const handleSend = async () => {
    if (!input.trim()) return;
    push({ from: "user", text: input });

    // respuesta local del bot
    push({ from: "bot", text: "Procesando..." });

    // si el usuario menciona 'humano', escalamos
    const lower = input.toLowerCase();
    if (lower.includes("humano") || lower.includes("asesor") || lower.includes("persona")) {
      try {
        const payload = {
          channel: "instagram",
          userHandle: "usuario_demo",
          conversationId: "conv-" + Date.now(),
          message: input,
        };
        const created = await api.createEscalation(payload);
        await api.alert({ type: "escalation", id: created.id, at: new Date().toISOString() });

        // actualizar UI
        push({ from: "bot", text: "He escalado tu caso a un humano. Pronto te responderán." });
        setEscalated(true);
      } catch (e) {
        push({ from: "bot", text: "Error al escalar. Intenta de nuevo más tarde." });
        console.error("Escalation error", e);
      }
    } else {
      // respuesta automatica simple
      setTimeout(() => {
        push({ from: "bot", text: "Soy un bot demo. Escribe 'humano' si deseas hablar con una persona." });
      }, 600);
    }
    setInput("");
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, maxWidth: 560 }}>
      <h3>Chat demo</h3>
      <div style={{ height: 220, overflowY: "auto", padding: 8, background: "#fafafa", marginBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.from === "user" ? "right" : "left", margin: "6px 0" }}>
            <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 10, background: m.from === "user" ? "#cfe9ff" : "#ececec" }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu mensaje..." style={{ flex: 1, padding: 8 }} />
        <button onClick={handleSend}>Enviar</button>
        <button onClick={async () => {
            // botón extra para forzar escalado manual sin texto
            try {
              const payload = { channel: "instagram", userHandle: "usuario_demo", conversationId: "conv-" + Date.now(), message: "Escalada manual desde UI" };
              const created = await api.createEscalation(payload);
              await api.alert({ type: "escalation", id: created.id, at: new Date().toISOString() });
              push({ from: "bot", text: "Caso escalado manualmente." });
              setEscalated(true);
            } catch (e) {
              push({ from: "bot", text: "Error al escalar manualmente." });
            }
        }}>Escalar</button>
      </div>

      {escalated && <div style={{ marginTop: 8, color: "#b45309" }}>✅ Caso escalado (revisa Bandeja)</div>}
    </div>
  );
}
