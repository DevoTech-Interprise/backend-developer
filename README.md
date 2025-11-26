=========================================================
📁 README.md - DOCUMENTAÇÃO DO PROJETO
=========================================================

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

backend/
├── src/
│   ├── controllers/     # Lógica das rotas
│   ├── database/        # Conexão com PostgreSQL
│   ├── middleware/      # Auth e permissions
│   └── routes/          # Definição das rotas
├── api/
│   └── index.ts         # Todas as rotas (Vercel)
├── package.json
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

================================================================================
📮 DOCUMENTAÇÃO POSTMAN
================================================================================

🚀 Documentação Postman - API de Autenticação

## 📋 Informações Gerais

Base URL: https://backend-developer-sigma.vercel.app/api

Headers Comuns:
- Content-Type: application/json
- Authorization: Bearer <jwt_token> (para rotas protegidas)

## 🔐 Coleção de Autenticação

### 1. Registrar Usuário
POST /auth/register

Body:
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456"
}

Response (201):
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 1,
    "email": "joao@email.com",
    "name": "João Silva",
    "role": "user",
    "created_at": "26/11/2025, 14:30:25"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

### 2. Login
POST /auth/login

Body:
{
  "email": "joao@email.com",
  "password": "123456"
}

Response (200):
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "email": "joao@email.com",
    "name": "João Silva",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

### 3. Verificar Token
GET /auth/verify

Headers:
- Authorization: Bearer <token>

Response (200):
{
  "valid": true,
  "user": {
    "id": 1,
    "id_type": "number",
    "email": "joao@email.com"
  },
  "issued_at": "2025-11-26T14:30:25.000Z",
  "expires_at": "2025-12-03T14:30:25.000Z"
}

### 4. Refresh Token
POST /auth/refresh

Headers:
- Authorization: Bearer <token>

Response (200):
{
  "message": "Token atualizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

### 5. Perfil do Usuário
GET /auth/profile

Headers:
- Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": 1,
    "email": "joao@email.com",
    "name": "João Silva",
    "role": "user",
    "created_at": "26/11/2025, 14:30:25",
    "updated_at": "26/11/2025, 14:30:25"
  }
}

## 👥 Coleção de Usuários

### 1. Listar Todos Usuários (Apenas Admin)
GET /users

Headers:
- Authorization: Bearer <token_admin>

Response (200):
{
  "users": [
    {
      "id": 1,
      "email": "admin@email.com",
      "name": "Admin User",
      "role": "admin",
      "created_at": "26/11/2025, 14:30:25",
      "updated_at": "26/11/2025, 14:30:25"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}

### 2. Meu Perfil
GET /users/me

Headers:
- Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": 1,
    "email": "joao@email.com",
    "name": "João Silva",
    "role": "user",
    "created_at": "26/11/2025, 14:30:25",
    "updated_at": "26/11/2025, 14:30:25"
  }
}

### 3. Atualizar Meu Perfil
PUT /users/me

Headers:
- Authorization: Bearer <token>
- Content-Type: application/json

Body:
{
  "name": "João Silva Atualizado",
  "email": "novoemail@email.com"
}

Response (200):
{
  "message": "Usuário atualizado com sucesso",
  "user": {
    "id": 1,
    "email": "novoemail@email.com",
    "name": "João Silva Atualizado",
    "role": "user",
    "created_at": "26/11/2025, 14:30:25",
    "updated_at": "26/11/2025, 15:45:10"
  }
}

### 4. Buscar Usuário por ID
GET /users/1

Headers:
- Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": 1,
    "email": "joao@email.com",
    "name": "João Silva",
    "role": "user",
    "created_at": "26/11/2025, 14:30:25",
    "updated_at": "26/11/2025, 14:30:25"
  }
}

### 5. Atualizar Usuário
PUT /users/1

Headers:
- Authorization: Bearer <token_do_proprio_usuario_ou_admin>
- Content-Type: application/json

Body:
{
  "name": "Nome Atualizado",
  "email": "emailatualizado@email.com",
  "password": "novasenha123"
}

Response (200):
{
  "message": "Usuário atualizado com sucesso",
  "user": {
    "id": 1,
    "email": "emailatualizado@email.com",
    "name": "Nome Atualizado",
    "role": "user",
    "created_at": "26/11/2025, 14:30:25",
    "updated_at": "26/11/2025, 15:50:22"
  }
}

### 6. Deletar Usuário (Apenas Admin)
DELETE /users/2

Headers:
- Authorization: Bearer <token_admin>

Response (200):
{
  "message": "Usuário deletado com sucesso"
}

### 7. Promover para Admin (Apenas Admin)
PATCH /users/2/promote

Headers:
- Authorization: Bearer <token_admin>

Response (200):
{
  "message": "Usuário promovido para administrador com sucesso",
  "user": {
    "id": 2,
    "email": "usuario@email.com",
    "name": "Usuario Comum",
    "role": "admin"
  }
}

## ⚠️ Códigos de Erro Comuns

| Código | Descrição | Solução |
|--------|-----------|----------|
| 400 | Bad Request | Verifique o body da requisição |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Sem permissão para a ação |
| 404 | Not Found | Rota ou recurso não encontrado |
| 500 | Internal Error | Erro no servidor |

## 🔄 Fluxo de Trabalho Recomendado

1. Registrar usuário → /auth/register
2. Fazer login → /auth/login (guarde o token)
3. Verificar perfil → /auth/profile
4. Usar token em todas as requisições protegidas

## 🛡️ Variáveis de Ambiente no Postman

Crie estas variáveis na sua coleção:

- base_url: https://backend-developer-sigma.vercel.app/api
- token: (será preenchido após login)

## 📝 Exemplos de Testes

### Teste de Permissões
1. Login como user normal
2. Tentar acessar /users (deve dar 403)
3. Login como admin
4. Acessar /users (deve funcionar)

### Teste de Atualização
1. User tenta atualizar outro user (deve dar 403)
2. User atualiza próprio perfil (deve funcionar)
3. Admin atualiza qualquer user (deve funcionar)

---

💡 Dica: Use o "Tests" tab no Postman para automatizar a captura do token:

// No Tests tab do login
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set("token", response.token);
    console.log("Token salvo:", response.token);
}

Happy Testing! 🚀

================================================================================
🎯 RESUMO DAS ROTAS DISPONÍVEIS
================================================================================

URL BASE: https://backend-developer-sigma.vercel.app/api

🔐 AUTENTICAÇÃO:
✅ POST  /auth/register     - Registrar usuário
✅ POST  /auth/login        - Login
✅ GET   /auth/profile      - Perfil do usuário
✅ GET   /auth/verify       - Verificar token
✅ POST  /auth/refresh      - Refresh token

👥 USUÁRIOS:
✅ GET   /users             - Listar todos (apenas admin)
✅ GET   /users/me          - Meu perfil
✅ PUT   /users/me          - Atualizar meu perfil
✅ GET   /users/:id         - Buscar por ID
✅ PUT   /users/:id         - Atualizar usuário
✅ DELETE /users/:id        - Deletar (apenas admin)
✅ PATCH /users/:id/promote - Promover para admin (apenas admin)

🌐 HEALTH CHECK:
✅ GET   /                  - Status da API

================================================================================
📞 INFORMAÇÕES DE CONTATO
================================================================================

Projeto: Backend Developer API
URL: https://backend-developer-sigma.vercel.app
Repositório: (adicione URL do GitHub)
Desenvolvedor: Ellyson Alves
Data: Novembro 2025

Para suporte técnico ou dúvidas, entre em contato com o desenvolvedor.
