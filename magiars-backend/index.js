const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Variables de entorno (agrégalas en .env)
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "http://localhost:5173/auth/callback";
const JWT_SECRET = process.env.JWT_SECRET || "tu-llave-secreta-aqui";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
// RUTAS EXISTENTES
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

// ============================================================
// CHATBOT CON GEMINI
// ============================================================

// Función para detectar si requiere escalación
function requiresEscalation(message) {
  const escalationKeywords = ["humano", "asesor", "persona", "hablar con humano", "atención humana"];
  const lowerMessage = message.toLowerCase();
  return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Función para obtener respuesta de Gemini
async function getGeminiResponse(message, conversationHistory = []) {
  try {
    if (!GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY no configurada");
      return "Gemini no está configurado. Por favor, configura tu API key.";
    }

    console.log("Llamando a Gemini con mensaje:", message);

    // Obtener el modelo Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construir el prompt con el contexto de MAGIARS
    let prompt = `Eres el asistente inteligente de MAGIARS, un chatbot avanzado para Instagram basado en inteligencia artificial.

MAGIARS es una plataforma integral que:
- Automatiza la atención y respuesta a mensajes directos y comentarios en Instagram
- Monitorea y analiza estadísticas de publicaciones en tiempo real
- Genera informes personalizados con métricas clave de desempeño
- Se integra con otras herramientas de marketing digital para potenciar campañas

Tu función es ayudar a usuarios y empresas que gestionan redes sociales, ofreciendo soporte sobre:
- Cómo automatizar interacciones con seguidores
- Análisis de métricas y estadísticas de Instagram
- Configuración de integraciones con herramientas de marketing
- Generación de informes y dashboards personalizados
- Estrategias para mejorar engagement y resultados

Responde de manera profesional, concisa y orientada a resultados. Usa un tono amable pero experto en marketing digital y automatización.
\n\n`;
    
    // Agregar historial de conversación si existe
    if (conversationHistory.length > 0) {
      prompt += "Historial de la conversación:\n";
      conversationHistory.forEach(msg => {
        if (msg.role === "user") {
          prompt += `Usuario: ${msg.content}\n`;
        } else if (msg.role === "assistant") {
          prompt += `Asistente: ${msg.content}\n`;
        }
      });
      prompt += "\n";
    }
    
    prompt += `Usuario: ${message}\nAsistente:`;

    // Generar respuesta
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Respuesta de Gemini:", text);
    return text;
  } catch (error) {
    console.error("Error con Gemini:", error.message);
    return "Lo siento, hubo un error procesando tu solicitud. Intenta de nuevo.";
  }
}

// Función para categorizar conversación con Gemini
async function categorizeConversation(conversationHistory) {
  try {
    if (!GEMINI_API_KEY) {
      return "General";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construir resumen de la conversación
    let conversationText = "";
    conversationHistory.forEach(msg => {
      if (msg.role === "user") {
        conversationText += `Usuario: ${msg.content}\n`;
      } else if (msg.role === "assistant") {
        conversationText += `Bot: ${msg.content}\n`;
      }
    });

    const prompt = `Analiza la siguiente conversación y clasifícala en UNA de estas categorías exactas. Responde SOLO con el nombre de la categoría, nada más:

Categorías disponibles:
- Soporte Técnico
- Consulta de Precios
- Problema de Cuenta
- Integración
- Consulta General
- Escalación
- Otro

Conversación:
${conversationText}

Categoría:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim();

    console.log("Categoría detectada:", category);
    return category;
  } catch (error) {
    console.error("Error al categorizar:", error.message);
    return "General";
  }
}

// Función para generar título de conversación con Gemini
async function generateConversationTitle(firstMessage) {
  try {
    if (!GEMINI_API_KEY) {
      return firstMessage.substring(0, 30) + (firstMessage.length > 30 ? "..." : "");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Genera un título corto y descriptivo (máximo 40 caracteres) para una conversación que comienza con este mensaje del usuario. Responde SOLO con el título, sin comillas ni puntos:

Mensaje: "${firstMessage}"

Título:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let title = response.text().trim();
    
    // Limpiar el título de caracteres no deseados
    title = title.replace(/['"`.]/g, '').trim();
    
    // Asegurar que no exceda 40 caracteres
    if (title.length > 40) {
      title = title.substring(0, 37) + "...";
    }

    console.log("✅ Título generado:", title);
    return title;
  } catch (error) {
    console.error("❌ Error al generar título:", error.message);
    return firstMessage.substring(0, 30) + (firstMessage.length > 30 ? "..." : "");
  }
}

// Endpoint principal para mensajes
app.post("/api/messages", async (req, res) => {
  const { message, userId, conversationId, conversationHistory, isFirstMessage } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No se recibió mensaje" });
  }

  try {
    // Verificar si requiere escalación
    if (requiresEscalation(message)) {
      return res.json({ 
        reply: "Entendido. Te conectaremos con un agente humano pronto.", 
        requiresEscalation: true 
      });
    }
    
    // Generar título si es el primer mensaje
    let title = null;
    if (isFirstMessage) {
      console.log("🔍 Detectado primer mensaje, generando título...");
      title = await generateConversationTitle(message);
      console.log("📝 Título a enviar:", title);
    }
    
    // Usar Gemini para responder
    const reply = await getGeminiResponse(message, conversationHistory || []);
    
    console.log("Enviando respuesta al frontend:", reply);
    
    // Categorizar la conversación si tiene más de 2 mensajes
    let category = null;
    if (conversationHistory && conversationHistory.length >= 2) {
      category = await categorizeConversation([...conversationHistory, { role: "user", content: message }, { role: "assistant", content: reply }]);
    }
    
    // Guardar la conversación
    if (userId) {
      conversations.push({
        id: Date.now().toString(),
        userId: userId,
        conversationId: conversationId || "conv-" + Date.now(),
        userMessage: message,
        botReply: reply,
        category: category,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ reply, requiresEscalation: false, category, title });
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    return res.status(500).json({ error: "Error al procesar tu mensaje" });
  }
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