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
  // GET /api/users - Listar todos os usuários (com paginação)
  static async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Query para contar total
      const countResult = await pool.query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);

      // Query para buscar usuários
      const result = await pool.query(
        `SELECT id, email, name, created_at, updated_at 
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

  // GET /api/users/:id - Obter usuário por ID
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, email, name, created_at, updated_at 
         FROM users 
         WHERE id = $1`,
        [id]
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
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PUT /api/users/:id - Atualizar usuário
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, password } = req.body;
      const userId = (req as any).user.userId;

      console.log('🔍 Debug updateUser:', { id, userId, typeId: typeof id, typeUserId: typeof userId });

      // Verificar se usuário existe
      const userExists = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // CORREÇÃO: Converter ambos para número para comparação
      const userIdNum = parseInt(userId);
      const idNum = parseInt(id);

      console.log('🔍 Debug após conversão:', { idNum, userIdNum });

      // Verificar se o usuário tem permissão (só pode editar próprio perfil)
      if (idNum !== userIdNum) {
        return res.status(403).json({ 
          error: 'Sem permissão para editar este usuário',
          details: `Você só pode editar seu próprio perfil (ID: ${userIdNum})`
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
        RETURNING id, email, name, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      const user = result.rows[0];

      const userResponse = {
        ...user,
        created_at: formatToBrasilia(user.created_at),
        updated_at: user.updated_at ? formatToBrasilia(user.updated_at) : null
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

  // DELETE /api/users/:id - Deletar usuário
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      // Verificar se usuário existe
      const userExists = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // CORREÇÃO: Converter ambos para número para comparação
      const userIdNum = parseInt(userId);
      const idNum = parseInt(id);

      // Verificar se o usuário tem permissão (só pode deletar próprio perfil)
      if (idNum !== userIdNum) {
        return res.status(403).json({ 
          error: 'Sem permissão para deletar este usuário',
          details: `Você só pode deletar seu próprio perfil (ID: ${userIdNum})`
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

      // CORREÇÃO: Garantir que o ID é tratado como número
      const userIdNum = parseInt(userId);

      const result = await pool.query(
        `SELECT id, email, name, created_at, updated_at 
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
}
