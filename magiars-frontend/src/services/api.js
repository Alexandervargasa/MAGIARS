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
  getIntegrations() {
    return request("/integrations");
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

  // ============================================================
  // ESCALATIONS (HU-03 / HU-04)
  // ============================================================
  listEscalations() {
    return request("/escalations");
  },

  createEscalation(payload) {
    return request("/escalations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  replyEscalation(id, text) {
    return request(`/escalations/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  resolveEscalation(id) {
    return request(`/escalations/${id}/resolve`, { method: "POST" });
  },

  // ============================================================
  // CHATBOT (HU-01 / HU-02) - ACTUALIZADO PARA GEMINI
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

  getConversations(userId) {
    return request(`/conversations/${userId}`);
  },
};

export default api;