const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Alerts
app.post("/api/alerts", (req, res) => {
  console.log("Alert received:", req.body);
  res.json({ success: true });
});

// Integrations
let integrations = [];
app.get("/api/integrations", (req, res) => {
  res.json(integrations);
});
app.post("/api/integrations", (req, res) => {
  integrations.push(req.body);
  res.json({ success: true });
});
app.post("/api/integrations/test", (req, res) => {
  res.json({ success: true, message: "Connection test passed" });
});

// Escalations
let escalations = [];
let counter = 1;
app.get("/api/escalations", (req, res) => {
  res.json(escalations);
});
app.post("/api/escalations", (req, res) => {
  const esc = { id: counter++, ...req.body, status: "open", replies: [] };
  escalations.push(esc);
  res.json(esc);
});
app.post("/api/escalations/:id/reply", (req, res) => {
  const esc = escalations.find(e => e.id == req.params.id);
  if (!esc) return res.status(404).json({ error: "Not found" });
  esc.replies.push(req.body);
  res.json({ success: true });
});
app.post("/api/escalations/:id/resolve", (req, res) => {
  const esc = escalations.find(e => e.id == req.params.id);
  if (!esc) return res.status(404).json({ error: "Not found" });
  esc.status = "resolved";
  res.json({ success: true });
});

// 🔹 Chatbot logic (HU-01 & HU-02)
function getBotResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes("hola")) {
    return "¡Hola! Soy tu asistente automático 🤖. ¿En qué te ayudo?";
  } else if (msg.includes("ayuda")) {
    return "Claro, dime qué necesitas y te guiaré.";
  } else if (msg.includes("adios")) {
    return "¡Hasta luego! 👋";
  } else {
    return "Lo siento, no entendí tu mensaje. ¿Puedes reformularlo?";
  }
}

app.post("/api/messages", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No se recibió mensaje" });
  }

  const reply = getBotResponse(message);
  res.json({ reply });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`MAGIARS backend listening on http://localhost:${PORT}`);
});
