import { VercelRequest, VercelResponse } from '@vercel/node';
import { UserController } from '../src/controllers/userController';

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

  // Extrair path e parâmetros da URL
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  console.log('🔍 Rota users acessada:', { pathname, method, query: req.query });

  try {
    // ==================== USER ROUTES ====================

    // GET /api/users (listar todos - apenas admin)
    if (pathname === '/api/users' && method === 'GET') {
      return await withAuth(UserController.getAllUsers)(req, res);
    }

    // GET /api/users/me (meu perfil)
    if (pathname === '/api/users/me' && method === 'GET') {
      return await withAuth(UserController.getMyProfile)(req, res);
    }

    // PUT /api/users/me (atualizar meu perfil)
    if (pathname === '/api/users/me' && method === 'PUT') {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
      }
      
      // Usar middleware de auth primeiro
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id: userId.toString() };
        (req as any).body = req.body;
        return await UserController.updateUser(req as any, res as any);
      })(req, res);
    }

    // GET /api/users/:id (buscar por ID)
    if (pathname.startsWith('/api/users/') && method === 'GET') {
      const id = pathname.split('/').pop(); // Pega o último segmento
      if (!id || id === 'me') {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
      }
      
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id };
        return await UserController.getUserById(req as any, res as any);
      })(req, res);
    }

    // PUT /api/users/:id (atualizar)
    if (pathname.startsWith('/api/users/') && method === 'PUT') {
      const id = pathname.split('/').pop(); // Pega o último segmento
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
    if (pathname.startsWith('/api/users/') && method === 'DELETE') {
      const id = pathname.split('/').pop(); // Pega o último segmento
      if (!id) {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
      }
      
      return withAuth(async (req: VercelRequest, res: VercelResponse) => {
        (req as any).params = { id };
        return await UserController.deleteUser(req as any, res as any);
      })(req, res);
    }

    // PATCH /api/users/:id/promote (promover para admin)
    if (pathname.includes('/promote') && method === 'PATCH') {
      const pathParts = pathname.split('/');
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
    return res.status(404).json({ 
      error: 'Rota de usuários não encontrada',
      path: pathname,
      method: method,
      available_routes: [
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
    console.error('❌ Erro interno users:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
