import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração OTIMIZADA para Neon com timezone Brasil
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  application_name: 'auth-api',
  // Configurar timezone para Brasil
  options: '-c timezone=America/Sao_Paulo'
});

export const testConnection = async () => {
  let client;
  try {
    console.log('🔌 Conectando ao Neon...');
    client = await pool.connect();
    
    console.log('✅ Conectado ao Neon Postgres!');
    
    // Teste de query com timezone
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Hora do servidor (BR):', result.rows[0].current_time);
    console.log('🐘 PostgreSQL:', result.rows[0].pg_version.split(',')[0]);
    
    // Verificar timezone configurado
    const timezoneResult = await client.query('SHOW timezone');
    console.log('🌎 Timezone:', timezoneResult.rows[0].timezone);
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
};
