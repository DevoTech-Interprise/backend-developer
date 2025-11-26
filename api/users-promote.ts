import { VercelRequest, VercelResponse } from '@vercel/node';
import { UserController } from '../src/controllers/userController';

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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extrair ID da URL
  const urlParts = req.url?.split('/').filter(part => part.length > 0);
  const id = urlParts && urlParts.length > 0 ? urlParts[urlParts.length - 2] : undefined; // /users/1/promote

  console.log('🔍 Debug users-promote:', { url: req.url, id });

  if (!id) {
    return res.status(400).json({ error: 'ID do usuário não fornecido' });
  }

  if (req.method === 'PATCH') {
    (req as any).params = { id };
    return await withAuth(UserController.promoteToAdmin)(req, res);
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
