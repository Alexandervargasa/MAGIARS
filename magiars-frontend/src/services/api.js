// src/services/api.js
const API_URL = "http://localhost:4000/api";

async function request(path, opts = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
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

  // Alerts
  alert(payload) {
    return request("/alerts", { method: "POST", body: JSON.stringify(payload) });
  },

  // Integrations
  getIntegrations() {
    return request("/integrations");
  },
  saveIntegrations(data) {
    return request("/integrations", { method: "POST", body: JSON.stringify(data) });
  },
  testIntegrations() {
    return request("/integrations/test", { method: "POST" });
  },

  // Escalations (HU-03 / HU-04)
  listEscalations() {
    return request("/escalations");
  },
  createEscalation(payload) {
    return request("/escalations", { method: "POST", body: JSON.stringify(payload) });
  },
  replyEscalation(id, text) {
    return request(`/escalations/${id}/reply`, { method: "POST", body: JSON.stringify({ text }) });
  },
  resolveEscalation(id) {
    return request(`/escalations/${id}/resolve`, { method: "POST" });
  },
};

export default api;
