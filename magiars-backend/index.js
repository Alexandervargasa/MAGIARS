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

// 1. Registro de usuario
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Validaciones
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const user = await db.registerUser({ name, email, password });

    // Generar JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        authType: user.authType,
        role: user.role || 'user'
      },
      token: token,
    });
  } catch (error) {
    console.error("Error en registro:", error.message);
    
    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ error: "Este email ya está registrado" });
    }
    
    res.status(500).json({
      error: "Error al registrar usuario",
      message: error.message,
    });
  }
});

// ============================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================

// Middleware para verificar si el usuario es admin
async function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Obtener todos los usuarios (solo admin)
app.get("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Cambiar rol de usuario (solo admin)
app.put("/api/admin/users/:userId/role", isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: "Rol inválido" });
  }

  try {
    const updatedUser = await db.updateUserRole(userId, role);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error actualizando rol:", error);
    res.status(500).json({ error: "Error al actualizar rol" });
  }
});

// Eliminar usuario (solo admin)
app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
  const { userId } = req.params;

  // No permitir que el admin se elimine a sí mismo
  if (req.user.id === userId) {
    return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
  }

  try {
    await db.deleteUserById(userId);
    res.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// 2. Login de usuario
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    const user = await db.loginUser(email, password);

    // Generar JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        authType: user.authType,
        role: user.role || 'user'
      },
      token: token,
    });
  } catch (error) {
    console.error("Error en login:", error.message);
    
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }
    
    res.status(500).json({
      error: "Error al iniciar sesión",
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

    // ✅ El user ya viene con el role desde database.js
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
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

// Horarios de atención
function wantsToRate(message) {
  const ratingKeywords = ["gracias por la atención", "gracias por la atencion", "adiós", "adios", "hasta luego"];
  const lowerMessage = message.toLowerCase();
  return ratingKeywords.some(keyword => lowerMessage.includes(keyword));
}

async function isWithinBusinessHours() {
  try {
    const businessHours = await db.getBusinessHours();
    
    if (!businessHours.enabled) return true;

    const now = new Date().toLocaleString("en-US", { timeZone: businessHours.timezone });
    const currentDate = new Date(now);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = dayNames[currentDate.getDay()];
    const daySchedule = businessHours.schedule[currentDay];

    if (!daySchedule || !daySchedule.enabled) return false;

    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();
    const [openHour, openMin] = daySchedule.open.split(":").map(Number);
    const [closeHour, closeMin] = daySchedule.close.split(":").map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime < closeTime;
  } catch (error) {
    console.error("Error verificando horarios:", error);
    return true; // En caso de error, permitir acceso
  }
}

// Endpoint principal para mensajes - CORREGIDO
app.post("/api/messages", async (req, res) => {
  const { message, userId, conversationId, conversationHistory, isFirstMessage } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No se recibió mensaje" });
  }

  try {
    // Verificar horario de atención primero
    const withinHours = await isWithinBusinessHours();
    if (!withinHours) {
      const businessHours = await db.getBusinessHours();
      return res.json({ 
        reply: `Lo siento, actualmente estamos fuera de nuestro horario de atención. Nuestro horario es de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 2:00 PM (hora de Colombia). Por favor, vuelve en nuestro horario de atención. ¡Gracias!`,
        outOfHours: true,
        requiresEscalation: false
      });
    }
    
    // Verificar si quiere valorar
    if (wantsToRate(message)) {
      return res.json({
        reply: "¡Gracias por contactarnos! Nos encantaría saber tu opinión sobre la atención recibida.",
        showRating: true,
        requiresEscalation: false
      });
    }

    // Manejar conversación y mensajes
    let currentConversationId = conversationId;
    let conversationTitle = null;  // 👈 VARIABLE PARA EL TÍTULO
    
    // Si es el primer mensaje, crear conversación
    if (isFirstMessage && userId) {
      currentConversationId = `conv-${Date.now()}`;
      conversationTitle = await generateConversationTitle(message);  // 👈 GUARDAR TÍTULO
      await db.createConversation(userId, currentConversationId, conversationTitle);
      console.log(`✅ Nueva conversación creada: ${currentConversationId} - "${conversationTitle}"`);
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
        conversationId: currentConversationId,
        title: conversationTitle  // 👈 INCLUIR TÍTULO
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
      conversationId: currentConversationId,
      title: conversationTitle  // 👈 INCLUIR TÍTULO AQUÍ TAMBIÉN
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

// ============================================================
// VALORACIONES (HU-15)
// ============================================================

// Guardar valoración
app.post("/api/ratings", async (req, res) => {
  try {
    const { conversationId, userId, rating, comment } = req.body;
    
    if (!conversationId || !rating) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "La valoración debe estar entre 1 y 5" });
    }

    const newRating = await db.createRating({
      conversationId,
      userId,
      rating,
      comment: comment || ""
    });

    console.log("⭐ Nueva valoración guardada:", newRating);
    res.json({ success: true, rating: newRating });
  } catch (error) {
    console.error("Error guardando valoración:", error);
    res.status(500).json({ error: "Error al guardar valoración" });
  }
});

// Obtener valoraciones
app.get("/api/ratings", async (req, res) => {
  try {
    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.conversationId) filters.conversationId = req.query.conversationId;
    
    const ratings = await db.getRatings(filters);
    res.json(ratings);
  } catch (error) {
    console.error("Error obteniendo valoraciones:", error);
    res.status(500).json({ error: "Error al obtener valoraciones" });
  }
});

// Obtener estadísticas de valoraciones
app.get("/api/ratings/stats", async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const stats = await db.getRatingStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// ============================================================
// HORARIOS DE ATENCIÓN (HU-12)
// ============================================================

// Obtener horarios configurados
app.get("/api/business-hours", async (req, res) => {
  try {
    const businessHours = await db.getBusinessHours();
    res.json(businessHours);
  } catch (error) {
    console.error("Error obteniendo horarios:", error);
    res.status(500).json({ error: "Error al obtener horarios" });
  }
});

// Actualizar horarios
app.post("/api/business-hours", async (req, res) => {
  try {
    const { enabled, timezone, schedule } = req.body;
    
    const businessHours = await db.updateBusinessHours({
      enabled,
      timezone,
      schedule
    });
    
    console.log("🕐 Horarios actualizados:", businessHours);
    res.json({ success: true, businessHours });
  } catch (error) {
    console.error("Error actualizando horarios:", error);
    res.status(500).json({ error: "Error al actualizar horarios" });
  }
});

// Verificar si estamos en horario
app.get("/api/business-hours/check", async (req, res) => {
  try {
    const isOpen = await isWithinBusinessHours();
    const businessHours = await db.getBusinessHours();
    res.json({ isOpen, businessHours });
  } catch (error) {
    console.error("Error verificando horario:", error);
    res.status(500).json({ error: "Error al verificar horario" });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 MAGIARS backend listening on http://localhost:${PORT}`);
  console.log(`📊 SQLite database: magiars.db`);
});