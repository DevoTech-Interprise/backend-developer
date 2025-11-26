import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../src/controllers/authController';
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

  const { all } = req.query;
  const path = Array.isArray(all) ? all.join('/') : all || '';

  console.log('📝 Rota acessada:', path, 'Método:', req.method);

  try {
    // HEALTH CHECK - /api
    if (path === '' && req.method === 'GET') {
      const dbConnected = await testConnection();
      return res.json({ 
        status: 'OK', 
        message: 'Auth API funcionando',
        database: dbConnected ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      });
    }

    // TEST ROUTES - /api/test-routes
    if (path === 'test-routes' && req.method === 'GET') {
      return res.json({ 
        message: '✅ Teste de rotas funcionando!',
        path: path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }

    // AUTH ROUTES

    // REGISTER - /api/auth/register
    if (path === 'auth/register' && req.method === 'POST') {
      return await AuthController.register(req as any, res as any);
    }

    // LOGIN - /api/auth/login  
    if (path === 'auth/login' && req.method === 'POST') {
      return await AuthController.login(req as any, res as any);
    }

    // PROFILE - /api/auth/profile
    if (path === 'auth/profile' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
      }
      
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        (req as any).user = decoded;
        return await AuthController.getProfile(req as any, res as any);
      } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
      }
    }

    // Rota não encontrada
    return res.status(404).json({ 
      error: 'Rota não encontrada',
      path: path,
      method: req.method,
      available_routes: [
        'GET /api',
        'GET /api/test-routes', 
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/profile (com token)'
      ]
    });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
