import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../src/controllers/authController';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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

  return res.status(405).json({ error: 'Método não permitido' });
}
