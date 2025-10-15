// src/services/api.js
const API_URL = "http://localhost:4000/api";

async function request(path, opts = {}) {
  const url = `${API_URL}${path}`;
  const token = localStorage.getItem("authToken");
  
  const headers = {
    "Content-Type": "application/json",
    ...opts.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  // Health
  health() {
    return request("/health");
  },

  // ============================================================
  // AUTENTICACIÓN CON META
  // ============================================================
  getMetaLoginUrl() {
    return request("/auth/meta-login-url");
  },

  metaCallback(code) {
    return request("/auth/meta-callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  verifyToken() {
    return request("/auth/verify");
  },

  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    return request("/auth/logout", { method: "POST" });
  },

  // ============================================================
  // ALERTS
  // ============================================================
  alert(payload) {
    return request("/alerts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ============================================================
  // INTEGRATIONS
  // ============================================================
  getIntegrations(userId) {
    return request(`/integrations?userId=${userId}`);
  },

  saveIntegrations(data) {
    return request("/integrations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  testIntegrations() {
    return request("/integrations/test", { method: "POST" });
  },

  deleteIntegration(id) {
    return request(`/integrations/${id}`, {
      method: "DELETE",
    });
  },

  // ============================================================
  // ESCALATIONS (HU-03 / HU-04)
  // ============================================================
  listEscalations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.status) params.append("status", filters.status);
    
    const queryString = params.toString();
    return request(`/escalations${queryString ? `?${queryString}` : ""}`);
  },

  createEscalation(payload) {
    return request("/escalations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  replyEscalation(id, message, sender) {
    return request(`/escalations/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ message, sender }),
    });
  },

  resolveEscalation(id) {
    return request(`/escalations/${id}/resolve`, { method: "POST" });
  },

  // ============================================================
  // CHATBOT Y CONVERSACIONES
  // ============================================================
  sendMessage(message, userId, conversationId, conversationHistory = [], isFirstMessage = false) {
    return request("/messages", {
      method: "POST",
      body: JSON.stringify({ 
        message, 
        userId, 
        conversationId,
        conversationHistory,
        isFirstMessage
      }),
    });
  },

  // Obtener todas las conversaciones de un usuario
  getConversations(userId) {
    return request(`/conversations/${userId}`);
  },

  // Obtener mensajes de una conversación específica
  getConversationMessages(conversationId) {
    return request(`/conversations/${conversationId}/messages`);
  },

  // Eliminar una conversación
  deleteConversation(conversationId) {
    return request(`/conversations/${conversationId}`, {
      method: "DELETE",
    });
  },
};

export default api;