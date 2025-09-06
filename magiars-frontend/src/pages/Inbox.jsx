// src/pages/Inbox.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";

export default function Inbox() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const items = await api.listEscalations();
      setList(items);
    } catch (e) {
      console.error("Error loading escalations", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function doReply() {
    if (!selected || !reply.trim()) return;
    try {
      await api.replyEscalation(selected.id, reply.trim());
      setReply("");
      await load();
      setSelected((s) => ({ ...s, lastMessage: reply.trim(), history: [...s.history, { at: new Date().toISOString(), from: "cm", text: reply.trim() }] }));
    } catch (e) {
      console.error(e);
      alert("Error al enviar respuesta");
    }
  }

  async function doResolve() {
    if (!selected) return;
    try {
      await api.resolveEscalation(selected.id);
      await load();
      setSelected((s) => ({ ...s, status: "resolved" }));
    } catch (e) {
      console.error(e);
      alert("Error al marcar resuelto");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, padding: 16 }}>
      <div>
        <h2>Bandeja de escalados</h2>
        <button onClick={load} disabled={loading}>{loading ? "Cargando..." : "Actualizar"}</button>
        <div style={{ marginTop: 12 }}>
          {list.length === 0 && <div style={{ padding: 12 }}>No hay escalaciones.</div>}
          {list.map(item => (
            <div key={item.id} onClick={() => setSelected(item)} style={{ padding: 10, borderBottom: "1px solid #eee", cursor: "pointer", background: selected?.id === item.id ? "#f6f6f6" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>@{item.userHandle}</strong>
                <span style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ color: "#666", marginTop: 6 }}>{item.lastMessage}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: item.status === "resolved" ? "green" : "orange" }}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <h2>Detalle</h2>
        {!selected ? (
          <div>Selecciona una conversación para ver detalles y responder.</div>
        ) : (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>@{selected.userHandle}</strong> • <span style={{ color: "#666" }}>{selected.channel}</span>
            </div>

            <div style={{ border: "1px solid #eee", padding: 10, maxHeight: 320, overflowY: "auto", background: "#fafafa" }}>
              {selected.history.map((m, i) => (
                <div key={i} style={{ marginBottom: 8, textAlign: m.from === "cm" ? "right" : "left" }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{new Date(m.at).toLocaleTimeString()}</div>
                  <div style={{ display: "inline-block", padding: "6px 10px", borderRadius: 8, background: m.from === "cm" ? "#d1ffd9" : "#eee" }}>{m.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe una respuesta..." style={{ flex: 1, padding: 8 }} />
              <button onClick={doReply}>Responder</button>
              <button onClick={doResolve} disabled={selected.status === "resolved"}>Marcar resuelto</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
