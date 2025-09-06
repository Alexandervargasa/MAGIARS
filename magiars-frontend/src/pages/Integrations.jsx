// src/pages/Integrations.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";

const PLATFORMS = ["instagram", "facebook", "twitter"];

export default function Integrations() {
  const [form, setForm] = useState({ instagram: { token: "", webhook: "" }, facebook: { token: "", webhook: "" }, twitter: { token: "", webhook: "" } });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getIntegrations();
        if (data) setForm(data);
      } catch (e) {
        console.error("No se pudieron cargar integraciones", e);
      }
    })();
  }, []);

  function update(pf, key, value) {
    setForm((s) => ({ ...s, [pf]: { ...s[pf], [key]: value } }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveIntegrations(form);
      alert("Integraciones guardadas");
    } catch (e) {
      console.error(e);
      alert("Error guardando integraciones");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await api.testIntegrations();
      setTestResult(res);
    } catch (e) {
      console.error(e);
      alert("Error probando integraciones");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Integraciones</h2>
      <p>Configura tokens y webhooks:</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PLATFORMS.map((p) => (
          <div key={p} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
            <h4 style={{ textTransform: "capitalize" }}>{p}</h4>
            <label>Token</label>
            <input value={form[p]?.token || ""} onChange={(e) => update(p, "token", e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
            <label>Webhook URL</label>
            <input value={form[p]?.webhook || ""} onChange={(e) => update(p, "webhook", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
        <button onClick={test} disabled={testing}>{testing ? "Probando..." : "Probar Conexiones"}</button>
      </div>

      {testResult && (
        <div style={{ marginTop: 12 }}>
          <h4>Resultados</h4>
          <ul>
            {Object.entries(testResult).map(([k, v]) => (
              <li key={k}><b>{k}:</b> {v.ok ? "Conectado" : "No conectado"} — {v.details}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
