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

backend/<br/>
├── src/ <br/>
│ ├── controllers/ # Lógica das rotas <br/>
│ ├── database/ # Conexão com PostgreSQL <br/>
│ ├── middleware/ # Auth e permissions <br/>
│ └── routes/ # Definição das rotas <br/>
├── api/ <br/>
│ └── index.ts # Todas as rotas de autenticação (Vercel) <br/>
│ └── users.ts # Todas as rotas de usuarios (Vercel) <br/>
├── package.json <br/>
└── vercel.json
