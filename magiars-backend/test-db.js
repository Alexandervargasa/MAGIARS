// test-db.js
import dotenv from 'dotenv';
dotenv.config(); // carga .env primero

import db from './db.mysql.js';

console.log("Leyendo .env: DB_USER=", process.env.DB_USER ? "***oculto***" : process.env.DB_USER);

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM users;');
    console.log('✅ Conexión exitosa. Total de usuarios en la BD:', rows[0].total);
    process.exit();
  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    process.exit(1);
  }
}

testConnection();
