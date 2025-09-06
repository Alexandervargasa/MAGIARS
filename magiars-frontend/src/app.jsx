// src/App.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Inbox from "./pages/Inbox.jsx";
import Integrations from "./pages/Integrations.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import ConnectionStatusBanner from "./components/ConnectionStatusBanner.jsx";

export default function App() {
  return (
    <div>
      <ConnectionStatusBanner />
      <nav style={{ padding: 12, background: "#111827", color: "white" }}>
        <Link to="/" style={{ color: "white", marginRight: 12 }}>Inicio</Link>
        <Link to="/inbox" style={{ color: "white", marginRight: 12 }}>Inbox</Link>
        <Link to="/integrations" style={{ color: "white" }}>Integraciones</Link>
      </nav>

      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={
            <div>
              <h1>MAGIARS Frontend funcionando 🚀</h1>
              <p>Bienvenido — prueba el chat para escalar un caso.</p>
              <ChatWidget />
            </div>
          } />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/integrations" element={<Integrations />} />
        </Routes>
      </main>
    </div>
  );
}
