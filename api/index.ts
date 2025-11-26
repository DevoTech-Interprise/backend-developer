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

  // DEBUG: Log completo da requisição
  console.log('🔍 DEBUG Request:', {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query
  });

  try {
    // ==================== HEALTH CHECK ====================
    if ((req.url === '/api' || req.url === '/') && req.method === 'GET') {
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
    if (req.url === '/api/auth/register' && req.method === 'POST') {
      return await AuthController.register(req as any, res as any);
    }

    // POST /api/auth/login
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      return await AuthController.login(req as any, res as any);
    }

    // GET /api/auth/profile
    if (req.url === '/api/auth/profile' && req.method === 'GET') {
      return await withAuth(AuthController.getProfile)(req, res);
    }

    // ==================== VERIFY & REFRESH ROUTES ====================

    // GET /api/verify - Verificar token
    if (req.url === '/api/verify' && req.method === 'GET') {
      console.log('✅ Rota verify encontrada');
      return await AuthController.verifyToken(req as any, res as any);
    }

    // POST /api/refresh - Refresh token
    if (req.url === '/api/refresh' && req.method === 'POST') {
      console.log('✅ Rota refresh encontrada');
      return await AuthController.refreshToken(req as any, res as any);
    }

    // ==================== USER ROUTES ====================

    // GET /api/users (listar todos - apenas admin)
    if (req.url === '/api/users' && req.method === 'GET') {
      return await withAuth(UserController.getAllUsers)(req, res);
    }

    // GET /api/users/me (meu perfil)
    if (req.url === '/api/users/me' && req.method === 'GET') {
      return await withAuth(UserController.getMyProfile)(req, res);
    }

    // PUT /api/users/me (atualizar meu perfil)
    if (req.url === '/api/users/me' && req.method === 'PUT') {
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        const userId = (req as any).user.userId;
        (req as any).params = { id: userId.toString() };
        (req as any).body = req.body;
        return await UserController.updateUser(req as any, res as any);
      })(req, res);
    }

    // GET /api/users/:id (buscar por ID)
    if (req.url?.startsWith('/api/users/') && req.method === 'GET') {
      const id = req.url.split('/').pop(); // Pega o último segmento
      if (!id || id === 'me') {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
      }
      
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id };
        return await UserController.getUserById(req as any, res as any);
      })(req, res);
    }

    // PUT /api/users/:id (atualizar)
    if (req.url?.startsWith('/api/users/') && req.method === 'PUT') {
      const id = req.url.split('/').pop(); // Pega o último segmento
      if (!id || id === 'me') {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
      }
      
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id };
        (req as any).body = req.body;
        return await UserController.updateUser(req as any, res as any);
      })(req, res);
    }

    // DELETE /api/users/:id (deletar)
    if (req.url?.startsWith('/api/users/') && req.method === 'DELETE') {
      const id = req.url.split('/').pop(); // Pega o último segmento
      if (!id) {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
      }
      
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id };
        return await UserController.deleteUser(req as any, res as any);
      })(req, res);
    }

    // PATCH /api/users/:id/promote (promover para admin)
    if (req.url?.includes('/promote') && req.method === 'PATCH') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 2]; // Pega o ID antes de /promote
      
      if (!id) {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
      }
      
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id };
        return await UserController.promoteToAdmin(req as any, res as any);
      })(req, res);
    }

    // ==================== ROTA NÃO ENCONTRADA ====================
    console.log('❌ Rota não encontrada:', req.url);
    return res.status(404).json({ 
      error: 'Rota não encontrada',
      path: req.url,
      method: req.method,
      available_routes: [
        'GET /api',
        'POST /api/auth/register',
        'POST /api/auth/login', 
        'GET /api/auth/profile',
        'GET /api/verify',
        'POST /api/refresh',
        'GET /api/users (apenas admin)',
        'GET /api/users/me',
        'PUT /api/users/me',
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
