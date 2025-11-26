import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../src/controllers/authController';
import { UserController } from '../src/controllers/userController';
import { testConnection } from '../src/database/connection';

// Middleware de autenticação
const withAuth = (handler: Function) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
      const jwt = require('jsonwebtoken');
      
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Erro de configuração do servidor - JWT_SECRET' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      (req as any).user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(403).json({ error: 'Token inválido' });
    }
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extrair path da URL
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  console.log('🔍 Rota acessada:', { pathname, method, query: req.query });

  try {
    // ==================== HEALTH CHECK ====================
    if (pathname === '/api' && method === 'GET') {
      const dbConnected = await testConnection();
      return res.status(200).json({ 
        status: 'OK', 
        message: 'Auth API funcionando',
        database: dbConnected ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      });
    }

    // ==================== AUTH ROUTES ====================
    
    // POST /api/auth/register
    if (pathname === '/api/auth/register' && method === 'POST') {
      return await AuthController.register(req as any, res as any);
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      return await AuthController.login(req as any, res as any);
    }

    // GET /api/auth/profile
    if (pathname === '/api/auth/profile' && method === 'GET') {
      return await withAuth(AuthController.getProfile)(req, res);
    }

    // GET /api/auth/verify
    if (pathname === '/api/auth/verify' && method === 'GET') {
      return await AuthController.verifyToken(req as any, res as any);
    }

    // POST /api/auth/refresh
    if (pathname === '/api/auth/refresh' && method === 'POST') {
      return await AuthController.refreshToken(req as any, res as any);
    }

    // ==================== ROTA NÃO ENCONTRADA ====================
    return res.status(404).json({ 
      error: 'Rota não encontrada no index',
      path: pathname,
      method: method,
      available_routes: [
        'GET /api',
        'POST /api/auth/register',
        'POST /api/auth/login', 
        'GET /api/auth/profile',
        'GET /api/auth/verify',
        'POST /api/auth/refresh'
      ]
    });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
