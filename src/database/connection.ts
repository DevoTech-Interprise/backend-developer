import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração específica para Neon.tech
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requer SSL
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações otimizadas para Neon
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const testConnection = async () => {
  let client;
  try {
    console.log('🔌 Tentando conectar com:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    
    client = await pool.connect();
    console.log('✅ Conectado ao Neon Postgres!');
    
    // Teste específico para verificar tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Tabelas encontradas:', tables.rows.map(t => t.table_name));
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro detalhado:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    
    if (error.message.includes('SSL')) {
      console.error('   💡 SSL não configurado');
    }
    if (error.message.includes('password')) {
      console.error('   💡 Erro de autenticação');
    }
    if (error.message.includes('does not exist')) {
      console.error('   💡 Banco não existe');
    }
    
    return false;
  } finally {
    if (client) client.release();
  }
};
