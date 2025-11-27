import { Request, Response } from 'express';
import { pool } from '../database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Validar JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET não está definida');
}

// Função para formatar data no horário de Brasília
function formatToBrasilia(date: Date) {
  return new Date(date).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validações
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      // Verificar se usuário já existe
      const userExists = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Inserir usuário (role padrão é 'user')
      const result = await pool.query(
        `INSERT INTO users (email, password, name, role) 
         VALUES ($1, $2, $3, 'user') 
         RETURNING id, email, name, role, created_at`,
        [email.toLowerCase(), hashedPassword, name]
      );

      const user = result.rows[0];

      // Verificar JWT_SECRET antes de gerar token
      if (!JWT_SECRET) {
        console.error('JWT_SECRET não configurada');
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      // Incluir role no token
      const token = jwt.sign(
        { 
          userId: parseInt(user.id),
          email: user.email,
          role: user.role // ← NOVO: incluir role no token
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Formatar datas para resposta
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // ← NOVO: incluir role na resposta
        created_at: formatToBrasilia(user.created_at),
        created_at_iso: user.created_at
      };

      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: userResponse,
        token
      });

    } catch (message: any) {
      console.error('Erro no registro:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
      
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      if (!JWT_SECRET) {
        console.error('❌ JWT_SECRET não configurada na Vercel');
        return res.status(500).json({ 
          error: 'Erro de configuração do servidor',
          details: 'JWT_SECRET não está definida'
        });
      }

      // Buscar usuário incluindo role
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const user = result.rows[0];

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Incluir role no token
      const token = jwt.sign(
        { 
          userId: parseInt(user.id),
          email: user.email,
          role: user.role // ← NOVO: incluir role no token
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Formatar datas para resposta
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // ← NOVO: incluir role na resposta
        created_at: formatToBrasilia(user.created_at)
      };

      return res.json({
        message: 'Login realizado com sucesso',
        user: userResponse,
        token
      });

    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      const userId = (req as any).user.userId;
      const userIdNum = parseInt(userId);

      const result = await pool.query(
        'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
        [userIdNum]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = result.rows[0];
      
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // ← NOVO: incluir role na resposta
        created_at: formatToBrasilia(user.created_at),
        updated_at: user.updated_at ? formatToBrasilia(user.updated_at) : null
      };

      return res.json({ user: userResponse });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // NOVO: Endpoint para verificar token (debug)
  static async verifyToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      res.json({
        valid: true,
        user: {
          id: decoded.userId,
          id_type: typeof decoded.userId,
          email: decoded.email
        },
        issued_at: new Date(decoded.iat * 1000).toISOString(),
        expires_at: new Date(decoded.exp * 1000).toISOString()
      });

    } catch (error) {
      return res.status(403).json({ 
        valid: false,
        error: 'Token inválido ou expirado' 
      });
    }
  }

  // NOVO: Endpoint para refresh token
  static async refreshToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      // Verificar token atual
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Buscar usuário no banco para garantir que ainda existe
      const result = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [parseInt(decoded.userId)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = result.rows[0];

      // Gerar novo token
      const newToken = jwt.sign(
        { 
          userId: parseInt(user.id),
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Token atualizado com sucesso',
        token: newToken
      });

    } catch (error) {
      return res.status(403).json({ error: 'Token inválido' });
    }
  }
}
