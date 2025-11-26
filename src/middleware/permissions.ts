import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se é admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      details: 'Apenas administradores podem realizar esta ação'
    });
  }

  next();
};

// Middleware para verificar se é o próprio usuário ou admin
export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const targetUserId = parseInt(req.params.id);
  
  if (!user) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  const isSelf = user.userId === targetUserId;
  const isAdmin = user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      details: 'Você só pode editar seu próprio perfil'
    });
  }

  next();
};

// Middleware para verificar se é admin (para deletar)
export const requireAdminForDelete = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const targetUserId = parseInt(req.params.id);
  
  if (!user) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  const isSelf = user.userId === targetUserId;
  const isAdmin = user.role === 'admin';

  // Usuário não pode se deletar, apenas admin pode deletar qualquer usuário
  if (isSelf) {
    return res.status(403).json({ 
      error: 'Ação não permitida',
      details: 'Você não pode deletar sua própria conta. Contate um administrador.'
    });
  }

  if (!isAdmin) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      details: 'Apenas administradores podem deletar usuários'
    });
  }

  next();
};
