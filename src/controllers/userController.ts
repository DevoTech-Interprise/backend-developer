import { Request, Response } from 'express';
import { pool } from '../database/connection';
import bcrypt from 'bcryptjs';

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

export class UserController {
  // GET /api/users - Listar todos os usuários (apenas admin)
  static async getAllUsers(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      // Apenas admin pode listar todos os usuários
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Acesso negado',
          details: 'Apenas administradores podem listar todos os usuários'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const countResult = await pool.query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT id, email, name, role, created_at, updated_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const users = result.rows.map(user => ({
        ...user,
        created_at: formatToBrasilia(user.created_at),
        updated_at: user.updated_at ? formatToBrasilia(user.updated_at) : null
      }));

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /api/users/:id - Obter usuário por ID (próprio usuário ou admin)
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const userIdNum = parseInt(id);
      const isSelf = user.userId === userIdNum;
      const isAdmin = user.role === 'admin';

      // Apenas próprio usuário ou admin pode ver o perfil
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          details: 'Você só pode ver seu próprio perfil'
        });
      }

      const result = await pool.query(
        `SELECT id, email, name, role, created_at, updated_at 
         FROM users 
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userData = result.rows[0];
      const userResponse = {
        ...userData,
        created_at: formatToBrasilia(userData.created_at),
        updated_at: userData.updated_at ? formatToBrasilia(userData.updated_at) : null
      };

      res.json({ user: userResponse });

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PUT /api/users/:id - Atualizar usuário (próprio usuário ou admin)
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, password, role } = req.body;
      const user = (req as any).user;

      console.log('🔍 Debug updateUser:', { id, userId: user.userId, userRole: user.role });

      // Verificar se usuário existe
      const userExists = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [id]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const targetUser = userExists.rows[0];
      const userIdNum = parseInt(id);
      const isSelf = user.userId === userIdNum;
      const isAdmin = user.role === 'admin';

      // Apenas próprio usuário ou admin pode editar
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          details: 'Você só pode editar seu próprio perfil'
        });
      }

      // Apenas admin pode alterar role
      if (role && !isAdmin) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          details: 'Apenas administradores podem alterar roles'
        });
      }

      // Preparar campos para atualização
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (name) {
        updateFields.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }

      if (email) {
        // Verificar se email já existe (excluindo o próprio usuário)
        const emailExists = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, id]
        );

        if (emailExists.rows.length > 0) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }

        updateFields.push(`email = $${paramCount}`);
        values.push(email.toLowerCase());
        paramCount++;
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields.push(`password = $${paramCount}`);
        values.push(hashedPassword);
        paramCount++;
      }

      if (role && isAdmin) {
        if (!['admin', 'user'].includes(role)) {
          return res.status(400).json({ error: 'Role inválida. Use "admin" ou "user".' });
        }
        updateFields.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
      }

      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING id, email, name, role, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      const updatedUser = result.rows[0];

      const userResponse = {
        ...updatedUser,
        created_at: formatToBrasilia(updatedUser.created_at),
        updated_at: updatedUser.updated_at ? formatToBrasilia(updatedUser.updated_at) : null
      };

      res.json({
        message: 'Usuário atualizado com sucesso',
        user: userResponse
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // DELETE /api/users/:id - Deletar usuário (apenas admin, e não pode se deletar)
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Verificar se usuário existe
      const userExists = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userIdNum = parseInt(id);
      const isSelf = user.userId === userIdNum;
      const isAdmin = user.role === 'admin';

      // Usuário não pode se deletar
      if (isSelf) {
        return res.status(403).json({ 
          error: 'Ação não permitida',
          details: 'Você não pode deletar sua própria conta. Contate um administrador.'
        });
      }

      // Apenas admin pode deletar outros usuários
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          details: 'Apenas administradores podem deletar usuários'
        });
      }

      await pool.query('DELETE FROM users WHERE id = $1', [id]);

      res.json({ message: 'Usuário deletado com sucesso' });

    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /api/users/me - Obter perfil do usuário logado
  static async getMyProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const userIdNum = parseInt(userId);

      const result = await pool.query(
        `SELECT id, email, name, role, created_at, updated_at 
         FROM users 
         WHERE id = $1`,
        [userIdNum]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = result.rows[0];
      const userResponse = {
        ...user,
        created_at: formatToBrasilia(user.created_at),
        updated_at: user.updated_at ? formatToBrasilia(user.updated_at) : null
      };

      res.json({ user: userResponse });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // NOVO: Promover usuário para admin (apenas admin)
  static async promoteToAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Apenas admin pode promover outros usuários
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Acesso negado',
          details: 'Apenas administradores podem promover usuários'
        });
      }

      // Verificar se usuário existe
      const userExists = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [id]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const targetUser = userExists.rows[0];

      // Não pode promover outro admin
      if (targetUser.role === 'admin') {
        return res.status(400).json({ error: 'Usuário já é administrador' });
      }

      // Promover para admin
      const result = await pool.query(
        'UPDATE users SET role = $1, updated_at = $2 WHERE id = $3 RETURNING id, email, name, role',
        ['admin', new Date(), id]
      );

      const promotedUser = result.rows[0];

      res.json({
        message: 'Usuário promovido para administrador com sucesso',
        user: promotedUser
      });

    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
