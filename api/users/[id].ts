import { VercelRequest, VercelResponse } from '@vercel/node';
import { UserController } from '../../src/controllers/userController';

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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // Obter usuário por ID
    if (req.method === 'GET') {
      (req as any).params = { id };
      return await withAuth(UserController.getUserById)(req, res);
    }

    // Atualizar usuário
    if (req.method === 'PUT') {
      (req as any).params = { id };
      (req as any).body = req.body;
      return await withAuth(UserController.updateUser)(req, res);
    }

    // Deletar usuário
    if (req.method === 'DELETE') {
      (req as any).params = { id };
      return await withAuth(UserController.deleteUser)(req, res);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na rota users/[id]:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
