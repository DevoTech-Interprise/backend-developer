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

  const { all } = req.query;
  const path = Array.isArray(all) ? all.join('/') : all || '';
  const method = req.method || 'GET';

  console.log('🔍 Rota acessada:', { path, method, query: req.query });

  try {
    // ==================== HEALTH CHECK ====================
    if (path === '' && method === 'GET') {
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
    if (path === 'auth/register' && method === 'POST') {
      return await AuthController.register(req as any, res as any);
    }

    // POST /api/auth/login
    if (path === 'auth/login' && method === 'POST') {
      return await AuthController.login(req as any, res as any);
    }

    // GET /api/auth/profile
    if (path === 'auth/profile' && method === 'GET') {
      return await withAuth(AuthController.getProfile)(req, res);
    }

    // GET /api/auth/verify
    if (path === 'auth/verify' && method === 'GET') {
      return await AuthController.verifyToken(req as any, res as any);
    }

    // POST /api/auth/refresh
    if (path === 'auth/refresh' && method === 'POST') {
      return await AuthController.refreshToken(req as any, res as any);
    }

    // ==================== USER ROUTES ====================

    // GET /api/users (listar todos - apenas admin)
    if (path === 'users' && method === 'GET') {
      return await withAuth(UserController.getAllUsers)(req, res);
    }

    // GET /api/users/me (meu perfil)
    if (path === 'users/me' && method === 'GET') {
      return await withAuth(UserController.getMyProfile)(req, res);
    }

    // GET /api/users/:id (buscar por ID)
    if (path.startsWith('users/') && method === 'GET') {
      const id = path.split('/')[1];
      (req as any).params = { id };
      return await withAuth(UserController.getUserById)(req, res);
    }

    // PUT /api/users/:id (atualizar)
    if (path.startsWith('users/') && method === 'PUT') {
      const id = path.split('/')[1];
      (req as any).params = { id };
      (req as any).body = req.body;
      return await withAuth(UserController.updateUser)(req, res);
    }

    // DELETE /api/users/:id (deletar)
    if (path.startsWith('users/') && method === 'DELETE') {
      const id = path.split('/')[1];
      (req as any).params = { id };
      return await withAuth(UserController.deleteUser)(req, res);
    }

    // PATCH /api/users/:id/promote (promover para admin)
    if (path.includes('users/') && path.includes('promote') && method === 'PATCH') {
      const id = path.split('/')[1];
      (req as any).params = { id };
      return await withAuth(UserController.promoteToAdmin)(req, res);
    }

    // ==================== ROTA NÃO ENCONTRADA ====================
    return res.status(404).json({ 
      error: 'Rota não encontrada',
      path: path,
      method: method,
      available_routes: [
        'POST /api/auth/register',
        'POST /api/auth/login', 
        'GET /api/auth/profile',
        'GET /api/auth/verify',
        'POST /api/auth/refresh',
        'GET /api/users (apenas admin)',
        'GET /api/users/me',
        'GET /api/users/:id',
        'PUT /api/users/:id', 
        'DELETE /api/users/:id (apenas admin)',
        'PATCH /api/users/:id/promote (apenas admin)'
      ]
    });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
