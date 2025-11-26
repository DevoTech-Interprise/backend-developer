import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas exigem autenticação
router.get('/users', authenticateToken, UserController.getAllUsers);
router.get('/users/me', authenticateToken, UserController.getMyProfile);
router.get('/users/:id', authenticateToken, UserController.getUserById);
router.put('/users/:id', authenticateToken, UserController.updateUser);
router.delete('/users/:id', authenticateToken, UserController.deleteUser);

export { router as userRoutes };
