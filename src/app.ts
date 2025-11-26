import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database/connection';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes'; // ← Adicione esta linha

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes); // ← Adicione esta linha

// Health check
app.get('/api', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({ 
      status: 'OK', 
      message: 'Auth API funcionando localmente',
      database: dbConnected ? 'Conectado' : 'Desconectado',
      timestamp: new Date().toISOString(),
      environment: 'development'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicialização
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('❌ Aviso: Não conectado ao banco de dados');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
      console.log(`👥 User routes: http://localhost:${PORT}/api/users`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
