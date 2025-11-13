// database.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcrypt');

let db = null;

// ============================================================
// HELPER: OBTENER FECHA EN ZONA HORARIA DE COLOMBIA
// ============================================================
function getColombiaDateTime() {
  return new Date().toLocaleString("en-US", { 
    timeZone: "America/Bogota",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');
}

// Inicializar la base de datos
async function initDatabase() {
  if (db) return db;

  try {
    db = await open({
      filename: path.join(__dirname, 'magiars.db'),
      driver: sqlite3.Database
    });

    console.log('✅ Base de datos SQLite conectada');

    // Crear tablas si no existen
    await db.exec(`
      -- Tabla de usuarios (ACTUALIZADA con campos para auth local)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        metaId TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        avatar TEXT,
        authType TEXT DEFAULT 'local',
        role TEXT DEFAULT 'user',
        loginDate TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de conversaciones
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        conversationId TEXT NOT NULL,
        title TEXT,
        category TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Tabla de mensajes (historial de chat)
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES conversations(conversationId) ON DELETE CASCADE
      );

      -- Tabla de integraciones
      CREATE TABLE IF NOT EXISTS integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        platform TEXT NOT NULL,
        apiKey TEXT,
        webhookUrl TEXT,
        isActive INTEGER DEFAULT 1,
        config TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Tabla de escalaciones
      CREATE TABLE IF NOT EXISTS escalations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        conversationId TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        issue TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        resolvedAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Tabla de respuestas a escalaciones
      CREATE TABLE IF NOT EXISTS escalation_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escalationId INTEGER NOT NULL,
        message TEXT NOT NULL,
        sender TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (escalationId) REFERENCES escalations(id) ON DELETE CASCADE
      );

      -- Tabla de valoraciones (HU-15)
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES conversations(conversationId) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Tabla de horarios de atención (HU-12)
      CREATE TABLE IF NOT EXISTS business_hours (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        enabled INTEGER DEFAULT 1,
        timezone TEXT DEFAULT 'America/Bogota',
        schedule TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Índices para mejorar rendimiento
      CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId);
      CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_integrations_userId ON integrations(userId);
      CREATE INDEX IF NOT EXISTS idx_escalations_userId ON escalations(userId);
      CREATE INDEX IF NOT EXISTS idx_ratings_conversationId ON ratings(conversationId);
      CREATE INDEX IF NOT EXISTS idx_ratings_userId ON ratings(userId);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Tablas creadas correctamente');
    return db;
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
    throw error;
  }
}

// ============================================================
// FUNCIONES PARA USUARIOS - AUTENTICACIÓN LOCAL
// ============================================================

async function registerUser(userData) {
  const db = await initDatabase();
  const { name, email, password } = userData;
  
  try {
    // Verificar si el email ya existe
    const existing = await db.get('SELECT * FROM users WHERE email = ?', email);
    
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario con fecha en zona horaria de Colombia
    const id = Date.now().toString();
    const colombiaDate = getColombiaDateTime();
    
    await db.run(
      'INSERT INTO users (id, name, email, password, authType, role, loginDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, 'local', 'user', colombiaDate, colombiaDate]
    );
    
    return { 
      id, 
      name, 
      email, 
      authType: 'local',
      role: 'user'
    };
  } catch (error) {
    console.error('❌ Error en registerUser:', error);
    throw error;
  }
}

async function loginUser(email, password) {
  const db = await initDatabase();
  
  try {
    // Buscar usuario por email
    const user = await db.get('SELECT * FROM users WHERE email = ? AND authType = ?', [email, 'local']);
    
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Actualizar fecha de login con hora de Colombia
    await db.run(
      'UPDATE users SET loginDate = ? WHERE id = ?',
      [getColombiaDateTime(), user.id]
    );
    
    // Retornar usuario sin la contraseña
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authType: user.authType,
      role: user.role || 'user'
    };
  } catch (error) {
    console.error('❌ Error en loginUser:', error);
    throw error;
  }
}

async function getUserByEmail(email) {
  const db = await initDatabase();
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  
  if (user) {
    // No retornar la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
}

// ============================================================
// FUNCIONES PARA CONVERSACIONES
// ============================================================

async function createConversation(userId, conversationId, title = null) {
  const db = await initDatabase();
  const id = Date.now().toString();
  const colombiaDate = getColombiaDateTime();
  
  await db.run(
    'INSERT INTO conversations (id, userId, conversationId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, conversationId, title, colombiaDate, colombiaDate]
  );
  
  return { id, userId, conversationId, title };
}

async function updateConversationTitle(conversationId, title) {
  const db = await initDatabase();
  await db.run(
    'UPDATE conversations SET title = ?, updatedAt = ? WHERE conversationId = ?',
    [title, getColombiaDateTime(), conversationId]
  );
}

async function updateConversationCategory(conversationId, category) {
  const db = await initDatabase();
  await db.run(
    'UPDATE conversations SET category = ?, updatedAt = ? WHERE conversationId = ?',
    [category, getColombiaDateTime(), conversationId]
  );
}

async function getConversationsByUserId(userId) {
  const db = await initDatabase();
  return await db.all(
    'SELECT * FROM conversations WHERE userId = ? ORDER BY updatedAt DESC',
    userId
  );
}

async function getConversationById(conversationId) {
  const db = await initDatabase();
  return await db.get('SELECT * FROM conversations WHERE conversationId = ?', conversationId);
}

// ============================================================
// FUNCIONES PARA MENSAJES
// ============================================================

async function saveMessage(conversationId, role, content) {
  const db = await initDatabase();
  const colombiaDate = getColombiaDateTime();
  
  await db.run(
    'INSERT INTO messages (conversationId, role, content, timestamp) VALUES (?, ?, ?, ?)',
    [conversationId, role, content, colombiaDate]
  );
  
  await db.run(
    'UPDATE conversations SET updatedAt = ? WHERE conversationId = ?',
    [colombiaDate, conversationId]
  );
}

async function getMessagesByConversationId(conversationId) {
  const db = await initDatabase();
  return await db.all(
    'SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC',
    conversationId
  );
}

// ============================================================
// FUNCIONES PARA INTEGRACIONES
// ============================================================

async function createIntegration(integrationData) {
  const db = await initDatabase();
  const { userId, platform, apiKey, webhookUrl, config } = integrationData;
  const colombiaDate = getColombiaDateTime();
  
  const result = await db.run(
    'INSERT INTO integrations (userId, platform, apiKey, webhookUrl, config, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, platform, apiKey, webhookUrl, JSON.stringify(config || {}), colombiaDate]
  );
  
  return { id: result.lastID, ...integrationData };
}

async function getIntegrationsByUserId(userId) {
  const db = await initDatabase();
  const integrations = await db.all(
    'SELECT * FROM integrations WHERE userId = ? ORDER BY createdAt DESC',
    userId
  );
  
  return integrations.map(int => ({
    ...int,
    config: int.config ? JSON.parse(int.config) : {}
  }));
}

async function updateIntegration(id, updates) {
  const db = await initDatabase();
  const { platform, apiKey, webhookUrl, isActive, config } = updates;
  
  await db.run(
    'UPDATE integrations SET platform = ?, apiKey = ?, webhookUrl = ?, isActive = ?, config = ? WHERE id = ?',
    [platform, apiKey, webhookUrl, isActive ? 1 : 0, JSON.stringify(config || {}), id]
  );
}

async function deleteIntegration(id) {
  const db = await initDatabase();
  await db.run('DELETE FROM integrations WHERE id = ?', id);
}

// ============================================================
// FUNCIONES PARA ESCALACIONES
// ============================================================

async function createEscalation(escalationData) {
  const db = await initDatabase();
  const { userId, conversationId, priority, issue } = escalationData;
  const colombiaDate = getColombiaDateTime();
  
  const result = await db.run(
    'INSERT INTO escalations (userId, conversationId, priority, issue, createdAt) VALUES (?, ?, ?, ?, ?)',
    [userId, conversationId, priority || 'medium', issue, colombiaDate]
  );
  
  return {
    id: result.lastID,
    userId,
    conversationId,
    priority: priority || 'medium',
    status: 'open',
    issue,
    replies: []
  };
}

async function getEscalations(filters = {}) {
  const db = await initDatabase();
  let query = 'SELECT * FROM escalations WHERE 1=1';
  const params = [];
  
  if (filters.userId) {
    query += ' AND userId = ?';
    params.push(filters.userId);
  }
  
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  const escalations = await db.all(query, params);
  
  for (let esc of escalations) {
    esc.replies = await db.all(
      'SELECT * FROM escalation_replies WHERE escalationId = ? ORDER BY timestamp ASC',
      esc.id
    );
  }
  
  return escalations;
}

async function addEscalationReply(escalationId, message, sender) {
  const db = await initDatabase();
  const colombiaDate = getColombiaDateTime();
  
  await db.run(
    'INSERT INTO escalation_replies (escalationId, message, sender, timestamp) VALUES (?, ?, ?, ?)',
    [escalationId, message, sender, colombiaDate]
  );
}

async function resolveEscalation(escalationId) {
  const db = await initDatabase();
  
  await db.run(
    'UPDATE escalations SET status = ?, resolvedAt = ? WHERE id = ?',
    ['resolved', getColombiaDateTime(), escalationId]
  );
}

// ============================================================
// FUNCIONES PARA VALORACIONES (HU-15)
// ============================================================

async function createRating(ratingData) {
  const db = await initDatabase();
  const { conversationId, userId, rating, comment } = ratingData;
  const colombiaDate = getColombiaDateTime();
  
  const result = await db.run(
    'INSERT INTO ratings (conversationId, userId, rating, comment, timestamp) VALUES (?, ?, ?, ?, ?)',
    [conversationId, userId, rating, comment || '', colombiaDate]
  );
  
  return {
    id: result.lastID,
    conversationId,
    userId,
    rating,
    comment: comment || '',
    timestamp: colombiaDate
  };
}

async function getRatings(filters = {}) {
  const db = await initDatabase();
  let query = 'SELECT * FROM ratings WHERE 1=1';
  const params = [];
  
  if (filters.userId) {
    query += ' AND userId = ?';
    params.push(filters.userId);
  }
  
  if (filters.conversationId) {
    query += ' AND conversationId = ?';
    params.push(filters.conversationId);
  }
  
  query += ' ORDER BY timestamp DESC';
  
  return await db.all(query, params);
}

async function getRatingStats(userId = null) {
  const db = await initDatabase();
  let query = 'SELECT AVG(rating) as average, COUNT(*) as total FROM ratings';
  const params = [];
  
  if (userId) {
    query += ' WHERE userId = ?';
    params.push(userId);
  }
  
  return await db.get(query, params);
}

// ============================================================
// FUNCIONES PARA HORARIOS (HU-12)
// ============================================================

async function getBusinessHours() {
  const db = await initDatabase();
  const config = await db.get('SELECT * FROM business_hours WHERE id = 1');
  
  if (!config) {
    return {
      enabled: true,
      timezone: "America/Bogota",
      schedule: {
        monday: { open: "09:00", close: "18:00", enabled: true },
        tuesday: { open: "09:00", close: "18:00", enabled: true },
        wednesday: { open: "09:00", close: "18:00", enabled: true },
        thursday: { open: "09:00", close: "18:00", enabled: true },
        friday: { open: "09:00", close: "18:00", enabled: true },
        saturday: { open: "09:00", close: "14:00", enabled: true },
        sunday: { open: "00:00", close: "00:00", enabled: false },
      }
    };
  }
  
  return {
    enabled: config.enabled === 1,
    timezone: config.timezone,
    schedule: JSON.parse(config.schedule)
  };
}

async function updateBusinessHours(hoursData) {
  const db = await initDatabase();
  const { enabled, timezone, schedule } = hoursData;
  const colombiaDate = getColombiaDateTime();
  
  const existing = await db.get('SELECT * FROM business_hours WHERE id = 1');
  
  if (existing) {
    await db.run(
      'UPDATE business_hours SET enabled = ?, timezone = ?, schedule = ?, updatedAt = ? WHERE id = 1',
      [enabled ? 1 : 0, timezone, JSON.stringify(schedule), colombiaDate]
    );
  } else {
    await db.run(
      'INSERT INTO business_hours (id, enabled, timezone, schedule, createdAt, updatedAt) VALUES (1, ?, ?, ?, ?, ?)',
      [enabled ? 1 : 0, timezone, JSON.stringify(schedule), colombiaDate, colombiaDate]
    );
  }
  
  return await getBusinessHours();
}

// ============================================================
// FUNCIONES DE ADMINISTRACIÓN
// ============================================================

async function getAllUsers() {
  const db = await initDatabase();
  const users = await db.all('SELECT id, name, email, avatar, authType, role, loginDate, createdAt FROM users ORDER BY createdAt DESC');
  return users;
}

async function updateUserRole(userId, newRole) {
  const db = await initDatabase();
  
  if (!['user', 'admin'].includes(newRole)) {
    throw new Error('INVALID_ROLE');
  }
  
  await db.run(
    'UPDATE users SET role = ? WHERE id = ?',
    [newRole, userId]
  );
  
  const user = await getUserById(userId);
  return user;
}

async function deleteUserById(userId) {
  const db = await initDatabase();
  await db.run('DELETE FROM users WHERE id = ?', userId);
}

// ============================================================
// EXPORTAR FUNCIONES
// ============================================================

module.exports = {
  initDatabase,
  
  // Usuarios - Autenticación Local
  registerUser,
  loginUser,
  getUserByEmail,
  
  // Conversaciones
  createConversation,
  updateConversationTitle,
  updateConversationCategory,
  getConversationsByUserId,
  getConversationById,
  
  // Mensajes
  saveMessage,
  getMessagesByConversationId,
  
  // Integraciones
  createIntegration,
  getIntegrationsByUserId,
  updateIntegration,
  deleteIntegration,
  
  // Escalaciones
  createEscalation,
  getEscalations,
  addEscalationReply,
  resolveEscalation,
  
  // Valoraciones
  createRating,
  getRatings,
  getRatingStats,
  
  // Horarios
  getBusinessHours,
  updateBusinessHours,
  
  // Administración
  getAllUsers,
  updateUserRole,
  deleteUserById,
};