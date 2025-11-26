import { VercelRequest, VercelResponse } from '@vercel/node';
import { testConnection } from '../src/database/connection';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const dbConnected = await testConnection();
      
      return res.status(200).json({ 
        status: 'OK', 
        message: 'Auth API funcionando',
        database: dbConnected ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}