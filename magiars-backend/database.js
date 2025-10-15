// database.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

// Inicializar la base de datos
async function initDatabase() {
  if (db) return db;

  try {
    // Abrir o crear la base de datos
    db = await open({
      filename: path.join(__dirname, 'magiars.db'),
      driver: sqlite3.Database
    });

    console.log('✅ Base de datos SQLite conectada');

    // Crear tablas si no existen
    await db.exec(`
      -- Tabla de usuarios
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        metaId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
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

      -- Índices para mejorar rendimiento
      CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId);
      CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_integrations_userId ON integrations(userId);
      CREATE INDEX IF NOT EXISTS idx_escalations_userId ON escalations(userId);
    `);

    console.log('✅ Tablas creadas correctamente');
    return db;
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
    throw error;
  }
}

// ============================================================
// FUNCIONES PARA USUARIOS
// ============================================================

async function createOrUpdateUser(userData) {
  const db = await initDatabase();
  const { metaId, name, email, avatar } = userData;
  
  try {
    // Verificar si el usuario existe
    const existing = await db.get('SELECT * FROM users WHERE metaId = ?', metaId);
    
    if (existing) {
      // Actualizar usuario existente
      await db.run(
        'UPDATE users SET name = ?, email = ?, avatar = ?, loginDate = ? WHERE metaId = ?',
        [name, email, avatar, new Date().toISOString(), metaId]
      );
      // Retornar usuario actualizado con los nuevos datos
      return {
        id: existing.id,
        metaId: metaId,
        name: name,
        email: email,
        avatar: avatar
      };
    } else {
      // Crear nuevo usuario
      const id = Date.now().toString();
      await db.run(
        'INSERT INTO users (id, metaId, name, email, avatar, loginDate) VALUES (?, ?, ?, ?, ?, ?)',
        [id, metaId, name, email, avatar, new Date().toISOString()]
      );
      return { id, metaId, name, email, avatar };
    }
  } catch (error) {
    console.error('❌ Error en createOrUpdateUser:', error);
    
    // Si es error de constraint, intentar hacer update de emergencia
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.log('⚠️ Usuario ya existe, forzando actualización...');
      const existing = await db.get('SELECT * FROM users WHERE metaId = ?', metaId);
      if (existing) {
        await db.run(
          'UPDATE users SET name = ?, email = ?, avatar = ?, loginDate = ? WHERE metaId = ?',
          [name, email, avatar, new Date().toISOString(), metaId]
        );
        return {
          id: existing.id,
          metaId: metaId,
          name: name,
          email: email,
          avatar: avatar
        };
      }
    }
    throw error;
  }
}

async function getUserByMetaId(metaId) {
  const db = await initDatabase();
  return await db.get('SELECT * FROM users WHERE metaId = ?', metaId);
}

async function getUserById(userId) {
  const db = await initDatabase();
  return await db.get('SELECT * FROM users WHERE id = ?', userId);
}

async function deleteUser(metaId) {
  const db = await initDatabase();
  await db.run('DELETE FROM users WHERE metaId = ?', metaId);
}

// ============================================================
// FUNCIONES PARA CONVERSACIONES
// ============================================================

async function createConversation(userId, conversationId, title = null) {
  const db = await initDatabase();
  const id = Date.now().toString();
  
  await db.run(
    'INSERT INTO conversations (id, userId, conversationId, title) VALUES (?, ?, ?, ?)',
    [id, userId, conversationId, title]
  );
  
  return { id, userId, conversationId, title };
}

async function updateConversationTitle(conversationId, title) {
  const db = await initDatabase();
  await db.run(
    'UPDATE conversations SET title = ?, updatedAt = ? WHERE conversationId = ?',
    [title, new Date().toISOString(), conversationId]
  );
}

async function updateConversationCategory(conversationId, category) {
  const db = await initDatabase();
  await db.run(
    'UPDATE conversations SET category = ?, updatedAt = ? WHERE conversationId = ?',
    [category, new Date().toISOString(), conversationId]
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
  
  await db.run(
    'INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)',
    [conversationId, role, content]
  );
  
  // Actualizar timestamp de la conversación
  await db.run(
    'UPDATE conversations SET updatedAt = ? WHERE conversationId = ?',
    [new Date().toISOString(), conversationId]
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
  
  const result = await db.run(
    'INSERT INTO integrations (userId, platform, apiKey, webhookUrl, config) VALUES (?, ?, ?, ?, ?)',
    [userId, platform, apiKey, webhookUrl, JSON.stringify(config || {})]
  );
  
  return { id: result.lastID, ...integrationData };
}

async function getIntegrationsByUserId(userId) {
  const db = await initDatabase();
  const integrations = await db.all(
    'SELECT * FROM integrations WHERE userId = ? ORDER BY createdAt DESC',
    userId
  );
  
  // Parse config JSON
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
  
  const result = await db.run(
    'INSERT INTO escalations (userId, conversationId, priority, issue) VALUES (?, ?, ?, ?)',
    [userId, conversationId, priority || 'medium', issue]
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
  
  // Obtener replies para cada escalación
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
  
  await db.run(
    'INSERT INTO escalation_replies (escalationId, message, sender) VALUES (?, ?, ?)',
    [escalationId, message, sender]
  );
}

async function resolveEscalation(escalationId) {
  const db = await initDatabase();
  
  await db.run(
    'UPDATE escalations SET status = ?, resolvedAt = ? WHERE id = ?',
    ['resolved', new Date().toISOString(), escalationId]
  );
}

// ============================================================
// EXPORTAR FUNCIONES
// ============================================================

module.exports = {
  initDatabase,
  
  // Usuarios
  createOrUpdateUser,
  getUserByMetaId,
  getUserById,
  deleteUser,
  
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
};