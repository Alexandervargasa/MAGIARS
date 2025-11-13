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
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Sidebar - Lista de escalaciones */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>📥 Bandeja de Escalados</h2>
          <button 
            onClick={load} 
            disabled={loading}
            style={{
              ...styles.refreshButton,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "🔄 Cargando..." : "🔄 Actualizar"}
          </button>
        </div>

        <div style={styles.escalationsList}>
          {list.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <p style={styles.emptyText}>No hay escalaciones</p>
            </div>
          )}
          
          {list.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => setSelected(item)} 
              style={{
                ...styles.escalationItem,
                background: selected?.id === item.id 
                  ? 'rgba(102, 126, 234, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderLeft: selected?.id === item.id 
                  ? '3px solid #667eea' 
                  : '3px solid transparent',
                animationDelay: `${idx * 0.05}s`,
              }}
            >
              <div style={styles.escalationHeader}>
                <strong style={styles.userHandle}>@{item.userHandle}</strong>
                <span style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleString('es', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div style={styles.lastMessage}>
                {item.lastMessage}
              </div>
              
              <div style={styles.statusBadge}>
                <span style={{
                  ...styles.statusLabel,
                  background: item.status === "resolved" 
                    ? 'rgba(76, 175, 80, 0.2)' 
                    : 'rgba(255, 152, 0, 0.2)',
                  color: item.status === "resolved" ? '#4caf50' : '#ff9800',
                }}>
                  {item.status === "resolved" ? "✓ Resuelto" : "⏳ Pendiente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel - Detalle */}
      <div style={styles.mainPanel}>
        {!selected ? (
          <div style={styles.emptySelection}>
            <div style={styles.emptySelectionIcon}>💬</div>
            <h3 style={styles.emptySelectionTitle}>
              Selecciona una conversación
            </h3>
            <p style={styles.emptySelectionText}>
              Elige una escalación de la lista para ver detalles y responder
            </p>
          </div>
        ) : (
          <div style={styles.detailContainer}>
            {/* Header del chat */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderInfo}>
                <h3 style={styles.chatUserHandle}>@{selected.userHandle}</h3>
                <span style={styles.chatChannel}>
                  {selected.channel === 'instagram' && '📸 Instagram'}
                  {selected.channel === 'facebook' && '👥 Facebook'}
                  {selected.channel === 'twitter' && '🐦 Twitter'}
                </span>
              </div>
              <button 
                onClick={doResolve} 
                disabled={selected.status === "resolved"}
                style={{
                  ...styles.resolveButton,
                  opacity: selected.status === "resolved" ? 0.5 : 1,
                  cursor: selected.status === "resolved" ? 'not-allowed' : 'pointer',
                }}
              >
                {selected.status === "resolved" ? "✓ Resuelto" : "✓ Marcar Resuelto"}
              </button>
            </div>

            {/* Messages Area */}
            <div style={styles.messagesArea}>
              {selected.history.map((m, i) => (
                <div 
                  key={i} 
                  style={{
                    ...styles.messageWrapper,
                    justifyContent: m.from === "cm" ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={styles.messageContainer}>
                    <div style={styles.messageTime}>
                      {new Date(m.at).toLocaleTimeString('es', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div style={{
                      ...styles.messageBubble,
                      background: m.from === "cm" 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      border: m.from === "cm"
                        ? '1px solid rgba(102, 126, 234, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                    }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div style={styles.inputArea}>
              <input 
                value={reply} 
                onChange={(e) => setReply(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && doReply()}
                placeholder="Escribe una respuesta..." 
                style={styles.input}
              />
              <button 
                onClick={doReply}
                style={styles.sendButton}
              >
                Responder →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '20px',
    padding: '20px',
    height: 'calc(100vh - 110px)',
    maxWidth: '1600px',
    margin: '0 auto',
    animation: 'fadeIn 0.6s ease-out',
  },

  // SIDEBAR
  sidebar: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
  },

  sidebarTitle: {
    fontSize: '20px',
    color: '#fff',
    margin: '0 0 15px 0',
    fontWeight: '600',
  },

  refreshButton: {
    width: '100%',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  escalationsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
  },

  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },

  emptyIcon: {
    fontSize: '64px',
    marginBottom: '15px',
  },

  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },

  escalationItem: {
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    animation: 'slideIn 0.4s ease-out',
  },

  escalationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },

  userHandle: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
  },

  timestamp: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  lastMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    marginBottom: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  statusBadge: {
    display: 'flex',
    gap: '8px',
  },

  statusLabel: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '600',
  },

  // MAIN PANEL
  mainPanel: {
    background: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  emptySelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
  },

  emptySelectionIcon: {
    fontSize: '80px',
    marginBottom: '20px',
    opacity: 0.5,
  },

  emptySelectionTitle: {
    fontSize: '24px',
    color: '#fff',
    marginBottom: '10px',
    fontWeight: '600',
  },

  emptySelectionText: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    maxWidth: '400px',
  },

  detailContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  chatHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(15, 12, 41, 0.5)',
  },

  chatHeaderInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  chatUserHandle: {
    fontSize: '20px',
    color: '#fff',
    margin: 0,
    fontWeight: '600',
  },

  chatChannel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  resolveButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },

  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  messageWrapper: {
    display: 'flex',
    animation: 'fadeIn 0.3s ease-out',
  },

  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '70%',
  },

  messageTime: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '5px',
  },

  messageBubble: {
    padding: '12px 18px',
    borderRadius: '18px',
    backdropFilter: 'blur(10px)',
    wordWrap: 'break-word',
  },

  inputArea: {
    padding: '20px',
    borderTop: '1px solid rgba(102, 126, 234, 0.2)',
    display: 'flex',
    gap: '12px',
    background: 'rgba(15, 12, 41, 0.5)',
  },

  input: {
    flex: 1,
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '25px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },

  sendButton: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
};