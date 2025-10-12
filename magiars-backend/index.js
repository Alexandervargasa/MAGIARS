
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Variables de entorno (agrégalas en .env)
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "http://localhost:5173/auth/callback";
const JWT_SECRET = process.env.JWT_SECRET || "tu-llave-secreta-aqui";

// Almacenar usuarios (en producción usa base de datos)
let users = [];
let conversations = [];

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ============================================================
// RUTAS DE AUTENTICACIÓN CON META
// ============================================================

// 1. Generar URL de login con Meta
app.get("/api/auth/meta-login-url", (req, res) => {
  if (!META_APP_ID) {
    return res.status(400).json({ error: "META_APP_ID no configurado" });
  }

  const scopes = ["public_profile"];
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    scope: scopes.join(","),
    response_type: "code",
    display: "popup",
  });

  const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  res.json({ loginUrl });
});

// 2. Callback de Meta - Intercambiar code por token
app.post("/api/auth/meta-callback", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    // Intercambiar code por access_token
    const tokenResponse = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code: code,
      },
    });

    const { access_token } = tokenResponse.data;

    // Obtener datos del usuario
    const userResponse = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,name,email,picture",
        access_token: access_token,
      },
    });

    const { id, name, email, picture } = userResponse.data;

    // Guardar o actualizar usuario
    let user = users.find(u => u.metaId === id);
    if (!user) {
      user = {
        id: Date.now().toString(),
        metaId: id,
        name: name,
        email: email,
        avatar: picture?.data?.url || null,
        loginDate: new Date(),
      };
      users.push(user);
    } else {
      user.loginDate = new Date();
    }

    // Generar JWT
    const token = jwt.sign({ userId: user.id, metaId: id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token: token,
      accessToken: access_token,
    });
  } catch (error) {
    console.error("Error en callback de Meta:", error.message);
    res.status(500).json({
      error: "Error al autenticar con Meta",
      message: error.message,
    });
  }
});

// 3. Verificar token JWT
app.get("/api/auth/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// 4. Logout
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Sesión cerrada" });
});

// 5. Data Deletion Request (Requerido por Meta)
// Acepta GET y POST
app.get("/api/auth/data-deletion", (req, res) => {
  res.status(200).json({
    url: "https://jewel-unmelted-reanna.ngrok-free.dev/data-deletion",
    confirmation_code: `deletion_${Date.now()}`,
  });
});

app.post("/api/auth/data-deletion", (req, res) => {
  const { user_id, signed_request } = req.body;

  // Buscar y eliminar usuario
  const userIndex = users.findIndex(u => u.metaId === user_id);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    console.log(`Usuario ${user_id} eliminado`);
  }

  // Meta espera esta respuesta específica - DEBE ser 200 OK
  res.status(200).json({
    url: "https://jewel-unmelted-reanna.ngrok-free.dev/data-deletion",
    confirmation_code: `deletion_${Date.now()}`,
  });
});

// ============================================================
// RUTAS EXISTENTES (sin cambios)
// ============================================================

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

// Chatbot logic
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
  const { message, userId, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No se recibió mensaje" });
  }

  const reply = getBotResponse(message);
  
  // Guardar la conversación
  if (userId) {
    conversations.push({
      id: Date.now().toString(),
      userId: userId,
      conversationId: conversationId || "conv-" + Date.now(),
      userMessage: message,
      botReply: reply,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ reply });
});

// Obtener historial de conversaciones
app.get("/api/conversations/:userId", (req, res) => {
  const { userId } = req.params;
  const userConversations = conversations.filter(c => c.userId === userId);
  res.json(userConversations);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MAGIARS backend listening on http://localhost:${PORT}`);
});