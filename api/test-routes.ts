import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    message: '✅ Teste de rotas funcionando!',
    path: req.url,
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });
}
