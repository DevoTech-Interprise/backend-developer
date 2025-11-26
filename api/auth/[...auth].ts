import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../../src/controllers/authController';

// Middleware simplificado para Vercel
const withAuth = (handler: Function) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
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

  const { auth } = req.query;
  const route = Array.isArray(auth) ? auth[0] : auth;

  try {
    switch (route) {
      case 'register':
        if (req.method === 'POST') {
          return await AuthController.register(req as any, res as any);
        }
        break;

      case 'login':
        if (req.method === 'POST') {
          return await AuthController.login(req as any, res as any);
        }
        break;

      case 'profile':
        if (req.method === 'GET') {
          return await withAuth(AuthController.getProfile)(req, res);
        }
        break;

      default:
        return res.status(404).json({ error: 'Rota não encontrada' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}