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
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "magiars_webhook_2024";

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
    // Si no hay userId, devolver estructura vacía
    return res.json({
      instagram: { token: "", webhook: "" },
      facebook: { token: "", webhook: "" },
      twitter: { token: "", webhook: "" }
    });
  }
  
  try {
    const integrations = await db.getIntegrationsByUserId(userId);
    
    // Convertir array a objeto estructurado
    const structured = {
      instagram: { token: "", webhook: "" },
      facebook: { token: "", webhook: "" },
      twitter: { token: "", webhook: "" }
    };
    
    integrations.forEach(integration => {
      if (structured[integration.platform]) {
        structured[integration.platform] = {
          token: integration.apiKey || "",
          webhook: integration.webhookUrl || ""
        };
      }
    });
    
    res.json(structured);
  } catch (error) {
    console.error('Error al obtener integraciones:', error);
    res.status(500).json({ error: 'Error al obtener integraciones' });
  }
});

// Guardar integraciones desde el frontend
app.post("/api/integrations/save", async (req, res) => {
  const { userId, integrations } = req.body;
  
  if (!userId || !integrations) {
    return res.status(400).json({ error: "userId e integrations son requeridos" });
  }
  
  try {
    // Guardar cada plataforma
    for (const [platform, config] of Object.entries(integrations)) {
      if (config.token || config.webhook) {
        await db.saveIntegration({
          userId,
          platform,
          apiKey: config.token,
          webhookUrl: config.webhook,
          status: config.token ? 'active' : 'inactive'
        });
      }
    }
    
    res.json({ success: true, message: "Integraciones guardadas correctamente" });
  } catch (error) {
    console.error('Error al guardar integraciones:', error);
    res.status(500).json({ error: 'Error al guardar integraciones' });
  }
});

// Probar conexiones de integraciones
app.post("/api/integrations/test", async (req, res) => {
  const { integrations } = req.body;
  
  const results = {};
  
  // Probar Instagram
  if (integrations?.instagram?.token) {
    try {
      const response = await axios.get(
        'https://graph.facebook.com/v21.0/me/accounts',
        {
          params: { access_token: integrations.instagram.token }
        }
      );
      
      results.instagram = {
        ok: true,
        details: `✓ Token válido - ${response.data.data?.length || 0} páginas encontradas`
      };
    } catch (error) {
      results.instagram = {
        ok: false,
        details: `✗ Token inválido: ${error.response?.data?.error?.message || 'Error de conexión'}`
      };
    }
  } else {
    results.instagram = {
      ok: false,
      details: '○ Sin configurar'
    };
  }
  
  // Probar Facebook
  if (integrations?.facebook?.token) {
    try {
      const response = await axios.get(
        'https://graph.facebook.com/v21.0/me',
        {
          params: { 
            access_token: integrations.facebook.token,
            fields: 'id,name'
          }
        }
      );
      
      results.facebook = {
        ok: true,
        details: `✓ Conectado como: ${response.data.name}`
      };
    } catch (error) {
      results.facebook = {
        ok: false,
        details: `✗ Error: ${error.response?.data?.error?.message || 'Conexión fallida'}`
      };
    }
  } else {
    results.facebook = {
      ok: false,
      details: '○ Sin configurar'
    };
  }
  
  // Twitter (simulado)
  if (integrations?.twitter?.token) {
    results.twitter = {
      ok: false,
      details: '⚠️ Twitter API requiere autenticación OAuth 2.0'
    };
  } else {
    results.twitter = {
      ok: false,
      details: '○ Sin configurar'
    };
  }
  
  res.json(results);
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
// WEBHOOKS DE INSTAGRAM
// ============================================================

// Verificación del webhook (GET)
app.get("/api/webhook/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔍 Verificación de webhook recibida:", { mode, token });

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Verificación de webhook fallida");
    res.sendStatus(403);
  }
});

// Recibir eventos de Instagram (POST)
app.post("/api/webhook/instagram", async (req, res) => {
  try {
    const body = req.body;
    
    console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));
    
    // Meta requiere respuesta 200 inmediata
    res.status(200).send("EVENT_RECEIVED");

    // Verificar que es de Instagram
    if (body.object !== "instagram") {
      console.log("⚠️ Evento no es de Instagram");
      return;
    }

    // Procesar cada entrada
    for (const entry of body.entry) {
      console.log("📦 Procesando entrada:", entry.id);
      
      // MENSAJES DIRECTOS
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await handleInstagramMessage(event);
        }
      }

      // COMENTARIOS Y MENCIONES
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === "comments") {
            await handleInstagramComment(change.value);
          }
          
          if (change.field === "mentions") {
            await handleInstagramMention(change.value);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
  }
});

// ============================================================
// HANDLERS DE EVENTOS DE INSTAGRAM
// ============================================================

async function handleInstagramMessage(event) {
  try {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;

    console.log("💬 Evento de mensaje:", { senderId, recipientId });

    // Ignorar ecos (mensajes enviados por el bot)
    if (event.message && !event.message.is_echo) {
      const messageText = event.message.text;

      if (!messageText) {
        console.log("⚠️ Mensaje sin texto (imagen, sticker, etc.)");
        return;
      }

      console.log(`📩 Mensaje de ${senderId}: ${messageText}`);

      // Obtener token del usuario
      const PAGE_ACCESS_TOKEN = await getInstagramTokenForPage(recipientId);
      
      if (!PAGE_ACCESS_TOKEN) {
        console.log("❌ No hay token configurado para esta página");
        return;
      }

      // Crear/obtener usuario
      const userId = await getOrCreateUserFromInstagram(senderId);

      // Crear conversación
      const conversationId = `ig-${senderId}-${Date.now()}`;
      const conversationTitle = await generateConversationTitle(messageText);
      await db.createConversation(userId, conversationId, conversationTitle);

      // Guardar mensaje del usuario
      await db.saveMessage(conversationId, 'user', messageText);

      // Verificar horario
      const withinHours = await isWithinBusinessHours();
      if (!withinHours) {
        const reply = "🕐 Estamos fuera de horario. Horario: Lun-Vie 9AM-6PM, Sáb 9AM-2PM (Colombia). ¡Vuelve pronto!";
        await sendInstagramMessage(senderId, reply, PAGE_ACCESS_TOKEN);
        await db.saveMessage(conversationId, 'assistant', reply);
        return;
      }

      // Verificar escalación
      if (requiresEscalation(messageText)) {
        const reply = "👤 Te conectaremos con un humano pronto. Espera...";
        await sendInstagramMessage(senderId, reply, PAGE_ACCESS_TOKEN);
        await db.saveMessage(conversationId, 'assistant', reply);
        
        await db.createEscalation({
          userId,
          conversationId,
          platform: 'instagram',
          issue: messageText,
          priority: 'medium'
        });
        return;
      }

      // Respuesta con Gemini
      const reply = await getGeminiResponse(messageText, []);
      await sendInstagramMessage(senderId, reply, PAGE_ACCESS_TOKEN);
      await db.saveMessage(conversationId, 'assistant', reply);

      console.log(`✅ Respuesta enviada a ${senderId}`);
    }
  } catch (error) {
    console.error("❌ Error en handleInstagramMessage:", error);
  }
}

// ============================================================
// SISTEMA DE TRACKING DE COMENTARIOS RESPONDIDOS
// ============================================================

// Cache en memoria de comentarios ya respondidos
const respondedComments = new Set();

// Limpiar cache cada 24 horas
setInterval(() => {
  respondedComments.clear();
  console.log('🧹 Cache de comentarios respondidos limpiado');
}, 24 * 60 * 60 * 1000); // 24 horas

// 👇 ESTA ES LA VERSIÓN ACTUALIZADA DE handleInstagramComment
async function handleInstagramComment(comment) {
  try {
    const commentId = comment.id;
    const commentText = comment.text;
    const commenterId = comment.from.id;
    const commenterUsername = comment.from.username || 'unknown';

    console.log(`💬 Comentario de @${commenterUsername} (${commenterId}): "${commentText}"`);

    // 1. Verificar si ya respondimos este comentario
    if (respondedComments.has(commentId)) {
      console.log(`⏭️ Ignorado: Ya respondimos este comentario antes (${commentId})`);
      return;
    }

    // 2. Obtener el ID de nuestra cuenta
    const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
    
    // 3. Ignorar comentarios de nuestra propia cuenta
    if (commenterId === INSTAGRAM_USER_ID) {
      console.log(`⏭️ Ignorado: Es un comentario del bot (${commenterId})`);
      return;
    }

    const PAGE_ACCESS_TOKEN = await getInstagramTokenForPage(comment.media.id);
    
    if (!PAGE_ACCESS_TOKEN) {
      console.log("❌ No hay token para responder comentarios");
      return;
    }

    // 4. Verificar si es una respuesta a otro comentario
    if (comment.parent_id) {
      console.log(`⏭️ Ignorado: Es una respuesta a otro comentario (parent_id: ${comment.parent_id})`);
      return;
    }

    // 5. Verificar si necesita respuesta
    const needsReply = await shouldReplyToComment(commentText);

    if (needsReply) {
      // Generar respuesta personalizada
      const reply = await generateCommentReply(commentText);
      
      // Responder al comentario
      await replyToInstagramComment(commentId, reply, PAGE_ACCESS_TOKEN);
      
      // ✅ Marcar como respondido
      respondedComments.add(commentId);
      
      console.log(`✅ Comentario respondido: ${commentId}`);
      console.log(`   👤 Usuario: @${commenterUsername}`);
      console.log(`   📝 Respuesta: "${reply}"`);
      console.log(`   📊 Total respondidos: ${respondedComments.size}`);
    } else {
      console.log(`⏭️ Comentario ignorado (no requiere respuesta): "${commentText}"`);
    }
  } catch (error) {
    console.error("❌ Error en handleInstagramComment:", error);
  }
}

async function handleInstagramComment(comment) {
  try {
    const commentId = comment.id;
    const commentText = comment.text;
    const commenterId = comment.from.id;
    const commenterUsername = comment.from.username || 'unknown';

    console.log(`💬 Comentario de @${commenterUsername} (${commenterId}): "${commentText}"`);

    // Obtener el ID de nuestra cuenta para evitar loop
    const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
    
    // 1. Ignorar comentarios de nuestra propia cuenta
    if (commenterId === INSTAGRAM_USER_ID) {
      console.log(`⏭️ Ignorado: Es un comentario del bot (${commenterId})`);
      return;
    }

    const PAGE_ACCESS_TOKEN = await getInstagramTokenForPage(comment.media.id);
    
    if (!PAGE_ACCESS_TOKEN) {
      console.log("❌ No hay token para responder comentarios");
      return;
    }

    // 2. Verificar si es una respuesta a otro comentario (evitar responder respuestas)
    if (comment.parent_id) {
      console.log(`⏭️ Ignorado: Es una respuesta a otro comentario (parent_id: ${comment.parent_id})`);
      return;
    }

    // 3. Verificar si necesita respuesta (usando la nueva lógica mejorada)
    const needsReply = await shouldReplyToComment(commentText);

    if (needsReply) {
      // Generar respuesta personalizada
      const reply = await generateCommentReply(commentText);
      
      // Responder al comentario
      await replyToInstagramComment(commentId, reply, PAGE_ACCESS_TOKEN);
      
      console.log(`✅ Comentario respondido: ${commentId}`);
      console.log(`   👤 Usuario: @${commenterUsername}`);
      console.log(`   📝 Respuesta: "${reply}"`);
      
      // Opcional: Guardar en base de datos que ya respondimos este comentario
      // para evitar responder dos veces si hay delay
    } else {
      console.log(`⏭️ Comentario ignorado (no requiere respuesta): "${commentText}"`);
    }
  } catch (error) {
    console.error("❌ Error en handleInstagramComment:", error);
  }
}

async function handleInstagramMention(mention) {
  try {
    const mentionerId = mention.from.id;
    console.log(`📣 Mención de ${mentionerId}`);

    const PAGE_ACCESS_TOKEN = await getInstagramTokenForPage(mention.media_id);
    
    if (PAGE_ACCESS_TOKEN) {
      const message = "¡Gracias por mencionarnos! 🎉 ¿Cómo podemos ayudarte?";
      await sendInstagramMessage(mentionerId, message, PAGE_ACCESS_TOKEN);
    }
  } catch (error) {
    console.error("❌ Error en handleInstagramMention:", error);
  }
}

// ============================================================
// FUNCIONES AUXILIARES DE INSTAGRAM
// ============================================================

async function getInstagramTokenForPage(pageId) {
  try {
    const database = await db.initDatabase();
    const integration = await database.get(
      "SELECT apiKey FROM integrations WHERE platform = 'instagram' AND isActive = 1 LIMIT 1"
    );
    
    return integration?.apiKey || process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  }
}

async function sendInstagramMessage(recipientId, messageText, accessToken) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: messageText }
      },
      {
        params: { access_token: accessToken }
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error.response?.data || error.message);
    throw error;
  }
}

async function replyToInstagramComment(commentId, replyText, accessToken) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${commentId}/replies`,
      {
        message: replyText
      },
      {
        params: { access_token: accessToken }
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error respondiendo comentario:", error.response?.data || error.message);
    throw error;
  }
}

async function getOrCreateUserFromInstagram(igUserId) {
  try {
    let user = await db.getUserByInstagramId(igUserId);
    
    if (!user) {
      const profile = await getInstagramProfile(igUserId);
      
      user = await db.registerUser({
        name: profile?.name || `Usuario IG ${igUserId}`,
        email: `ig_${igUserId}@instagram.temp`,
        password: Math.random().toString(36).slice(-8),
        authType: 'instagram',
        instagramId: igUserId,
        avatar: profile?.profile_pic || null
      });
      
      console.log(`✅ Usuario creado desde Instagram: ${user.id}`);
    }
    
    return user.id;
  } catch (error) {
    console.error("❌ Error obteniendo/creando usuario:", error);
    return 'instagram_user';
  }
}

async function getInstagramProfile(igUserId) {
  try {
    const PAGE_ACCESS_TOKEN = await getInstagramTokenForPage(igUserId);
    
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${igUserId}`,
      {
        params: {
          fields: "name,username,profile_pic",
          access_token: PAGE_ACCESS_TOKEN
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error.response?.data || error.message);
    return null;
  }
}

// ============================================================
// LÓGICA MEJORADA PARA RESPONDER COMENTARIOS
// ============================================================

async function shouldReplyToComment(commentText) {
  try {
    // Normalizar el texto
    const text = commentText.toLowerCase().trim();
    
    // 1. SIEMPRE responder si contiene estas palabras clave
    const keywordsAlwaysReply = [
      // Preguntas
      '?', 'cómo', 'como', 'qué', 'que', 'cuánto', 'cuanto', 'dónde', 'donde',
      'cuál', 'cual', 'cuándo', 'cuando', 'por qué', 'porque',
      
      // Interés comercial
      'interesado', 'interesada', 'me interesa', 'estoy interesado',
      'precio', 'costo', 'cuanto cuesta', 'cuánto cuesta',
      'información', 'informacion', 'info', 'más información', 'mas informacion',
      'contacto', 'contactar', 'whatsapp', 'correo', 'email',
      'comprar', 'adquirir', 'contratar',
      
      // Solicitudes
      'ayuda', 'ayúdame', 'ayudame', 'necesito', 'quiero',
      'puedes', 'pueden', 'podrían', 'podrian',
      
      // Elogios que ameritan respuesta
      'excelente publicación', 'excelente publicacion',
      'muy bueno', 'muy buena', 'increíble', 'increible',
      'me encanta', 'me gusta mucho',
      
      // Solicitudes específicas
      'envíame', 'enviame', 'mándame', 'mandame', 'comparte',
      'quiero saber', 'dime', 'cuéntame', 'cuentame'
    ];
    
    // Verificar si contiene alguna palabra clave
    const hasKeyword = keywordsAlwaysReply.some(keyword => text.includes(keyword));
    
    if (hasKeyword) {
      console.log(`✅ Comentario con palabra clave detectada: "${commentText}"`);
      return true;
    }
    
    // 2. NO responder a comentarios muy cortos o solo emojis
    if (text.length < 3) {
      console.log(`⏭️ Comentario muy corto, no se responde: "${commentText}"`);
      return false;
    }
    
    // Solo emojis o caracteres especiales
    const onlyEmojis = /^[\s\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n]+$/u;
    if (onlyEmojis.test(text)) {
      console.log(`⏭️ Solo emojis, no se responde: "${commentText}"`);
      return false;
    }
    
    // 3. Para otros casos, usar Gemini para decidir
    if (!GEMINI_API_KEY) {
      console.log('⚠️ GEMINI_API_KEY no configurada, no se responderá');
      return false;
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Eres un asistente que decide si un comentario de Instagram requiere respuesta del bot de MAGIARS.

MAGIARS es una plataforma de automatización de Instagram con IA.

Responde "SI" si el comentario:
- Expresa interés genuino en el producto/servicio
- Es un elogio significativo (más que solo "nice" o "👍")
- Solicita información
- Pregunta algo
- Muestra intención de compra o contacto
- Es constructivo o propositivo

Responde "NO" si el comentario:
- Es solo emojis
- Es muy genérico ("nice", "cool", "👍")
- Es spam o irrelevante
- Es un saludo simple sin contexto

Comentario: "${commentText}"

Responde SOLO "SI" o "NO", nada más.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim().toUpperCase();
    
    const shouldReply = answer === "SI";
    
    if (shouldReply) {
      console.log(`🤖 Gemini decidió responder: "${commentText}"`);
    } else {
      console.log(`⏭️ Gemini decidió NO responder: "${commentText}"`);
    }
    
    return shouldReply;
    
  } catch (error) {
    console.error("Error determinando respuesta:", error);
    return false;
  }
}

// ============================================================
// OPCIONAL: Generar respuestas más personalizadas para comentarios
// ============================================================

async function generateCommentReply(commentText) {
  try {
    if (!GEMINI_API_KEY) {
      return "¡Gracias por tu comentario! 🙌 Escríbenos al DM para más información sobre MAGIARS.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Eres el bot de MAGIARS respondiendo a un comentario en Instagram.

MAGIARS es una plataforma que:
- Automatiza respuestas en Instagram con IA
- Analiza métricas y estadísticas en tiempo real
- Gestiona conversaciones y comentarios automáticamente
- Mejora el engagement y resultados de marketing

El comentario dice: "${commentText}"

Genera una respuesta:
- Corta (máximo 2-3 líneas)
- Amigable y profesional
- Si preguntan por precio/info, invítalos a escribir al DM
- Si es un elogio, agradece y menciona algo de MAGIARS
- Usa 1 emoji relevante máximo
- NO uses hashtags

Respuesta:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let reply = response.text().trim();
    
    // Limpiar la respuesta
    reply = reply.replace(/['"`.]/g, '').trim();
    
    // Limitar a 150 caracteres (límite razonable para comentarios)
    if (reply.length > 150) {
      reply = reply.substring(0, 147) + "...";
    }

    return reply;
    
  } catch (error) {
    console.error("Error generando respuesta de comentario:", error);
    return "¡Gracias por tu interés! 💙 Escríbenos al DM para más información.";
  }
}

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
    return true;
  }
}

// Endpoint principal para mensajes
app.post("/api/messages", async (req, res) => {
  const { message, userId, conversationId, conversationHistory, isFirstMessage } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No se recibió mensaje" });
  }

  try {
    const withinHours = await isWithinBusinessHours();
    if (!withinHours) {
      const businessHours = await db.getBusinessHours();
      return res.json({ 
        reply: `Lo siento, actualmente estamos fuera de nuestro horario de atención. Nuestro horario es de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 2:00 PM (hora de Colombia). Por favor, vuelve en nuestro horario de atención. ¡Gracias!`,
        outOfHours: true,
        requiresEscalation: false
      });
    }
    
    if (wantsToRate(message)) {
      return res.json({
        reply: "¡Gracias por contactarnos! Nos encantaría saber tu opinión sobre la atención recibida.",
        showRating: true,
        requiresEscalation: false
      });
    }

    let currentConversationId = conversationId;
    let conversationTitle = null;
    
    if (isFirstMessage && userId) {
      currentConversationId = `conv-${Date.now()}`;
      conversationTitle = await generateConversationTitle(message);
      await db.createConversation(userId, currentConversationId, conversationTitle);
      console.log(`✅ Nueva conversación creada: ${currentConversationId} - "${conversationTitle}"`);
    }
    
    if (currentConversationId) {
      await db.saveMessage(currentConversationId, 'user', message);
    }
    
    if (requiresEscalation(message)) {
      const reply = "Entendido. Te conectaremos con un agente humano pronto.";
      
      if (currentConversationId) {
        await db.saveMessage(currentConversationId, 'assistant', reply);
      }
      
      return res.json({ 
        reply, 
        requiresEscalation: true,
        conversationId: currentConversationId,
        title: conversationTitle
      });
    }
    
    const reply = await getGeminiResponse(message, conversationHistory || []);
    
    if (currentConversationId) {
      await db.saveMessage(currentConversationId, 'assistant', reply);
    }
    
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
      title: conversationTitle
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
    
    await database.run('DELETE FROM conversations WHERE conversationId = ?', conversationId);
    
    console.log(`🗑️ Conversación ${conversationId} eliminada`);
    res.json({ success: true, message: "Conversación eliminada correctamente" });
  } catch (error) {
    console.error('❌ Error al eliminar conversación:', error);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
});

// ============================================================
// VALORACIONES
// ============================================================

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
// HORARIOS DE ATENCIÓN
// ============================================================

app.get("/api/business-hours", async (req, res) => {
  try {
    const businessHours = await db.getBusinessHours();
    res.json(businessHours);
  } catch (error) {
    console.error("Error obteniendo horarios:", error);
    res.status(500).json({ error: "Error al obtener horarios" });
  }
});

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
  console.log(`📸 Instagram webhook: /api/webhook/instagram`);
});