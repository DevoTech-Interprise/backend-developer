import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requireSelfOrAdmin, requireAdminForDelete } from '../middleware/permissions';

const router = Router();

// Todas as rotas exigem autenticação
router.get('/users', authenticateToken, UserController.getAllUsers);
router.get('/users/me', authenticateToken, UserController.getMyProfile);
router.get('/users/:id', authenticateToken, UserController.getUserById);
router.put('/users/:id', authenticateToken, UserController.updateUser);
router.delete('/users/:id', authenticateToken, UserController.deleteUser);

// NOVA ROTA: Promover usuário para admin
router.patch('/users/:id/promote', authenticateToken, UserController.promoteToAdmin);

export { router as userRoutes };
