========================================================= <br/>
📁 README.md - DOCUMENTAÇÃO DO PROJETO <br/>
=========================================================<br/>

# 🔐 API de Autenticação com Node.js + TypeScript

Uma API completa de autenticação e gerenciamento de usuários com sistema de roles (admin/user), desenvolvida em Node.js, TypeScript e PostgreSQL.

## 🚀 Tecnologias

- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (Neon.tech)
- **Autenticação**: JWT Tokens
- **Hash**: bcryptjs
- **Deploy**: Vercel
- **CORS**: Habilitado

## 📋 Funcionalidades

### 🔐 Autenticação
- ✅ Registro de usuários
- ✅ Login com JWT
- ✅ Verificação de token
- ✅ Refresh token
- ✅ Perfil do usuário logado

### 👥 Gerenciamento de Usuários
- ✅ CRUD completo de usuários
- ✅ Sistema de roles (admin/user)
- ✅ Permissões baseadas em roles
- ✅ Usuário só edita próprio perfil
- ✅ Admin edita/deleta qualquer usuário
- ✅ Admin promove usuários para admin
- ✅ Usuário não pode se deletar

### 🛡️ Segurança
- ✅ Senhas hasheadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Middleware de autenticação
- ✅ Validação de permissões
- ✅ CORS configurado

## 🏗️ Estrutura do Projeto

backend/ <br/>
├── src/ <br/>
│   ├── controllers/     # Lógica das rotas <br/>
│   ├── database/        # Conexão com PostgreSQL <br/>
│   ├── middleware/      # Auth e permissions <br/>
│   └── routes/          # Definição das rotas <br/>
├── api/ <br/>
│   └── index.ts         # Todas as rotas de auth (Vercel) <br/>
│   └── users.ts         # Todas as rotas de users (Vercel) <br/>
├── package.json <br/>
└── vercel.json

## 🚀 Como Usar

### Variáveis de Ambiente
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=seu_jwt_secret_super_seguro
NODE_ENV=production

### Instalação Local
# Clonar repositório
git clone <url-do-repositorio>
cd backend

# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

## 📊 Endpoints da API

### 🔐 Autenticação
- POST /api/auth/register - Registrar usuário
- POST /api/auth/login - Fazer login
- GET /api/auth/profile - Perfil do usuário
- GET /api/auth/verify - Verificar token
- POST /api/auth/refresh - Refresh token

### 👥 Usuários
- GET /api/users - Listar usuários (apenas admin)
- GET /api/users/me - Meu perfil
- PUT /api/users/me - Atualizar meu perfil
- GET /api/users/:id - Buscar usuário por ID
- PUT /api/users/:id - Atualizar usuário
- DELETE /api/users/:id - Deletar usuário (apenas admin)
- PATCH /api/users/:id/promote - Promover para admin (apenas admin)

## 🔐 Sistema de Permissões

| Ação | User | Admin |
|------|------|-------|
| Ver próprio perfil | ✅ | ✅ |
| Editar próprio perfil | ✅ | ✅ |
| Ver outros perfis | ❌ | ✅ |
| Editar outros perfis | ❌ | ✅ |
| Listar todos usuários | ❌ | ✅ |
| Deletar própria conta | ❌ | ❌ |
| Deletar outros usuários | ❌ | ✅ |
| Promover usuários | ❌ | ✅ |

## 🗄️ Banco de Dados

### Tabela users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## 🌐 Deploy na Vercel

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático

URL de Produção: https://backend-developer-sigma.vercel.app

## 🧪 Testes

# Health Check
curl https://backend-developer-sigma.vercel.app/api

# Registrar usuário
curl -X POST https://backend-developer-sigma.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuario","email":"user@email.com","password":"123456"}'

# Login
curl -X POST https://backend-developer-sigma.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"123456"}'

---

Desenvolvido com ❤️ usando Node.js, TypeScript e PostgreSQL
