import { VercelRequest, VercelResponse } from '@vercel/node';
import { testConnection } from '../src/database/connection';

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
    try {
      const dbConnected = await testConnection();
      const horaBrasil = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });

      return res.status(200).json({
        // Apresentação
        mensagem: '👋 Bem-vindo à API de Autenticação',
        descricao: 'Sistema completo de autenticação com JWT',
        versao: '1.0.0',
        ambiente: process.env.NODE_ENV || 'produção',
        
        // Status
        status: '✅ Online',
        database: dbConnected ? '✅ Conectado' : '❌ Desconectado',
        horario_servidor: horaBrasil,
        fuso_horario: 'Brasília (BRT)',
        
        // Rotas disponíveis
        rotas: {
          autenticacao: {
            registrar: {
              metodo: 'POST',
              caminho: '/api/auth/register',
              descricao: 'Cadastrar novo usuário',
              corpo: {
                nome: 'string (obrigatório)',
                email: 'string (obrigatório, único)',
                senha: 'string (obrigatório, mínimo 6 caracteres)'
              }
            },
            login: {
              metodo: 'POST',
              caminho: '/api/auth/login', 
              descricao: 'Fazer login na aplicação',
              corpo: {
                email: 'string (obrigatório)',
                senha: 'string (obrigatório)'
              }
            },
            perfil: {
              metodo: 'GET',
              caminho: '/api/auth/profile',
              descricao: 'Obter dados do usuário logado',
              autenticacao: 'Token JWT no header Authorization'
            }
          }
        },

        // Como usar
        como_usar: [
          '1. Registrar usuário: POST /api/auth/register',
          '2. Fazer login: POST /api/auth/login (recebe token)',
          '3. Acessar perfil: GET /api/auth/profile com Authorization: Bearer <token>'
        ],

        // Tecnologias
        tecnologias: [
          'Node.js + TypeScript',
          'PostgreSQL + Neon.tech', 
          'JWT Authentication',
          'Vercel Hosting'
        ]
      });
    } catch (error) {
      return res.status(500).json({ 
        status: '❌ Erro',
        mensagem: 'Falha na conexão com o banco de dados'
      });
    }
  }

  return res.status(405).json({ 
    status: '❌ Método não permitido',
    mensagem: 'Utilize GET para obter informações da API'
  });
}
