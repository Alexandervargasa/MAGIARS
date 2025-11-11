// src/components/ConnectionStatusBanner.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";

export default function ConnectionStatusBanner() {
  const [healthy, setHealthy] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let stopped = false;

    async function tick() {
      if (stopped) return;
      try {
        await api.health();
        if (!stopped) {
          setHealthy(true);
          setMsg("");
        }
      } catch (e) {
        const message = e?.message || "Fallo de conexión";
        setHealthy(false);
        setMsg(message);
        // report to backend
        try { api.alert({ type: "connection_failure", at: new Date().toISOString(), message }); } catch {}
        // show browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("MAGIARS - Fallo de conexión", { body: message });
        } else if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      } finally {
        if (!stopped) setTimeout(tick, 8000);
      }
    }

    tick();
    return () => { stopped = true; };
  }, []);

  if (healthy) return null;

  return (
    <div style={{ background: "#b91c1c", color: "white", padding: 8, textAlign: "center" }}>
      ⚠️ Conexión inestable: {msg}
    </div>
  );
}
