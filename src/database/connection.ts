import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração para desenvolvimento local
export const pool = new Pool({
  user: process.env.DB_USER || 'auth_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_db',
  password: process.env.DB_PASSWORD || 'auth_password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: false,
});

// Testar conexão
export const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    
    // Teste adicional: fazer uma query simples
    const result = await client.query('SELECT version()');
    console.log('📋 Versão do PostgreSQL:', result.rows[0].version);
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro detalhado da conexão:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
};