const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Importar funciones de base de datos
const db = require('./database');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Variables de entorno
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "http://localhost:5173/auth/callback";
const JWT_SECRET = process.env.JWT_SECRET || "tu-llave-secreta-aqui";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Inicializar base de datos al arrancar
db.initDatabase().catch(err => {
  console.error('Error al inicializar base de datos:', err);
  process.exit(1);
});

// Health check principal
app.get("/", (req, res) => {
  res.json({ message: "✅ MAGIARS Backend conectado correctamente" });
});

// Health check API
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

    // Guardar o actualizar usuario en SQLite
    const user = await db.createOrUpdateUser({
      metaId: id,
      name: name,
      email: email,
      avatar: picture?.data?.url || null,
    });

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
app.get("/api/auth/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.userId);

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
app.get("/api/auth/data-deletion", (req, res) => {
  res.status(200).json({
    url: "https://jewel-unmelted-reanna.ngrok-free.dev/data-deletion",
    confirmation_code: `deletion_${Date.now()}`,
  });
});

app.post("/api/auth/data-deletion", async (req, res) => {
  const { user_id, signed_request } = req.body;

  try {
    // Eliminar usuario de la base de datos (CASCADE eliminará todo relacionado)
    await db.deleteUser(user_id);
    console.log(`Usuario ${user_id} eliminado de la base de datos`);
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
  }

  res.status(200).json({
    url: "https://jewel-unmelted-reanna.ngrok-free.dev/data-deletion",
    confirmation_code: `deletion_${Date.now()}`,
  });
});

// ============================================================
// RUTAS DE INTEGRACIONES
// ============================================================

app.get("/api/integrations", async (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  try {
    const integrations = await db.getIntegrationsByUserId(userId);
    res.json(integrations);
  } catch (error) {
    console.error('Error al obtener integraciones:', error);
    res.status(500).json({ error: 'Error al obtener integraciones' });
  }
});

app.post("/api/integrations", async (req, res) => {
  try {
    const integration = await db.createIntegration(req.body);
    res.json({ success: true, integration });
  } catch (error) {
    console.error('Error al crear integración:', error);
    res.status(500).json({ error: 'Error al crear integración' });
  }
});

app.post("/api/integrations/test", (req, res) => {
  res.json({ success: true, message: "Connection test passed" });
});

app.delete("/api/integrations/:id", async (req, res) => {
  try {
    await db.deleteIntegration(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar integración:', error);
    res.status(500).json({ error: 'Error al eliminar integración' });
  }
});

// ============================================================
// RUTAS DE ESCALACIONES
// ============================================================

app.get("/api/escalations", async (req, res) => {
  try {
    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.status) filters.status = req.query.status;
    
    const escalations = await db.getEscalations(filters);
    res.json(escalations);
  } catch (error) {
    console.error('Error al obtener escalaciones:', error);
    res.status(500).json({ error: 'Error al obtener escalaciones' });
  }
});

app.post("/api/escalations", async (req, res) => {
  try {
    const escalation = await db.createEscalation(req.body);
    res.json(escalation);
  } catch (error) {
    console.error('Error al crear escalación:', error);
    res.status(500).json({ error: 'Error al crear escalación' });
  }
});

app.post("/api/escalations/:id/reply", async (req, res) => {
  try {
    await db.addEscalationReply(req.params.id, req.body.message, req.body.sender);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al agregar respuesta:', error);
    res.status(500).json({ error: 'Error al agregar respuesta' });
  }
});

app.post("/api/escalations/:id/resolve", async (req, res) => {
  try {
    await db.resolveEscalation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al resolver escalación:', error);
    res.status(500).json({ error: 'Error al resolver escalación' });
  }
});

// ============================================================
// RUTAS DE ALERTAS
// ============================================================

app.post("/api/alerts", (req, res) => {
  console.log("Alert received:", req.body);
  res.json({ success: true });
});

// ============================================================
// CHATBOT CON GEMINI
// ============================================================

function requiresEscalation(message) {
  const escalationKeywords = ["humano", "asesor", "persona", "hablar con humano", "atención humana"];
  const lowerMessage = message.toLowerCase();
  return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
}

async function getGeminiResponse(message, conversationHistory = []) {
  try {
    if (!GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY no configurada");
      return "Gemini no está configurado. Por favor, configura tu API key.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error con Gemini:", error.message);
    return "Lo siento, hubo un error procesando tu solicitud. Intenta de nuevo.";
  }
}

async function categorizeConversation(conversationHistory) {
  try {
    if (!GEMINI_API_KEY) {
      return "General";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    return category;
  } catch (error) {
    console.error("Error al categorizar:", error.message);
    return "General";
  }
}

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
    
    title = title.replace(/['"`.]/g, '').trim();
    
    if (title.length > 40) {
      title = title.substring(0, 37) + "...";
    }

    return title;
  } catch (error) {
    console.error("Error al generar título:", error.message);
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
    let currentConversationId = conversationId;
    
    // Si es el primer mensaje, crear conversación
    if (isFirstMessage && userId) {
      currentConversationId = `conv-${Date.now()}`;
      const title = await generateConversationTitle(message);
      await db.createConversation(userId, currentConversationId, title);
    }
    
    // Guardar mensaje del usuario
    if (currentConversationId) {
      await db.saveMessage(currentConversationId, 'user', message);
    }
    
    // Verificar si requiere escalación
    if (requiresEscalation(message)) {
      const reply = "Entendido. Te conectaremos con un agente humano pronto.";
      
      if (currentConversationId) {
        await db.saveMessage(currentConversationId, 'assistant', reply);
      }
      
      return res.json({ 
        reply, 
        requiresEscalation: true,
        conversationId: currentConversationId
      });
    }
    
    // Usar Gemini para responder
    const reply = await getGeminiResponse(message, conversationHistory || []);
    
    // Guardar respuesta del bot
    if (currentConversationId) {
      await db.saveMessage(currentConversationId, 'assistant', reply);
    }
    
    // Categorizar si tiene suficientes mensajes
    let category = null;
    if (conversationHistory && conversationHistory.length >= 2) {
      category = await categorizeConversation([
        ...conversationHistory, 
        { role: "user", content: message }, 
        { role: "assistant", content: reply }
      ]);
      
      if (category && currentConversationId) {
        await db.updateConversationCategory(currentConversationId, category);
      }
    }

    return res.json({ 
      reply, 
      requiresEscalation: false, 
      category,
      conversationId: currentConversationId
    });
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    return res.status(500).json({ error: "Error al procesar tu mensaje" });
  }
});

// Obtener historial de conversaciones
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await db.getConversationsByUserId(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// Obtener mensajes de una conversación específica
app.get("/api/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await db.getMessagesByConversationId(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Eliminar conversación
app.delete("/api/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const database = await db.initDatabase();
    
    // SQLite con CASCADE eliminará automáticamente los mensajes relacionados
    await database.run('DELETE FROM conversations WHERE conversationId = ?', conversationId);
    
    console.log(`🗑️ Conversación ${conversationId} eliminada`);
    res.json({ success: true, message: "Conversación eliminada correctamente" });
  } catch (error) {
    console.error('❌ Error al eliminar conversación:', error);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 MAGIARS backend listening on http://localhost:${PORT}`);
  console.log(`📊 SQLite database: magiars.db`);
});