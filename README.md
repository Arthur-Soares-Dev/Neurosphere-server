# API de Tarefas e Autenticação

Este projeto é uma API RESTful construída com Node.js e Express, que oferece funcionalidades de autenticação de usuários e manipulação de tarefas. A API também integra o Firebase para gerenciamento de usuários, autenticação e armazenamento de arquivos.

## Funcionalidades

- **Autenticação de Usuários**:
  - Registro de usuários.
  - Login de usuários com autenticação via JWT.
  - Atualização de perfil de usuário.
  - Logout de usuários.

- **Gerenciamento de Tarefas**:
  - Criar, atualizar e deletar tarefas.
  - Recuperação de tarefas.

- **Integração com Firebase**:
  - Armazenamento de dados no Firebase Firestore.
  - Armazenamento de arquivos no Firebase Storage.
  - Autenticação de usuários via Firebase Admin SDK.

## Tecnologias Usadas

- **Node.js**: Plataforma de execução de JavaScript no servidor.
- **Express.js**: Framework para construção da API RESTful.
- **Firebase Admin SDK**: Integração com Firebase para autenticação, Firestore e Storage.
- **JWT (JSON Web Token)**: Sistema de autenticação baseado em tokens.
- **Multer**: Middleware para upload de arquivos.
- **dotenv**: Carregamento de variáveis de ambiente.
- **Express Rate Limit**: Prevenção contra ataques de força bruta.
- **express-session**: Gerenciamento de sessões de usuários.
- **Jest**: Framework de testes.

## Pré-requisitos

Antes de rodar o projeto, verifique se você tem o seguinte instalado:

- **Node.js**: [Baixe e instale o Node.js](https://nodejs.org/)
- **Firebase**: Tenha um projeto do Firebase configurado e as credenciais necessárias para autenticação e Firestore.

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Arthur-Soares-Dev/Neurosphere-server
cd Neurosphere-server
```

### 2. Instale as dependências

```bash
npm install

```

### 3. Crie um arquivo .env
Crie um arquivo .env na raiz do projeto e adicione as seguintes variáveis de ambiente (substitua pelos valores da sua configuração no Firebase):

```bash
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-email-do-cliente
FIREBASE_PRIVATE_KEY=seu-private-key
STORAGE_BUCKET=seu-storage-bucket
SESSION_SECRET=sua-chave-secreta
```

### 4. Inicie o servidor
Após a instalação das dependências e configuração do arquivo .env, você pode iniciar o servidor:
O servidor estará disponível em http://localhost:5000.
```bash
node index.js
```


## Endpoints da API

### **/auth** (Autenticação)

- **POST /auth/register**: Registra um novo usuário.
  - **Body**: 
    ```json
    { 
      "username": "usuario", 
      "password": "senha" 
    }
    ```
  - **Resposta**: 
    - Status: `201`
    - Dados do usuário

- **POST /auth/login**: Faz login com o usuário.
  - **Body**: 
    ```json
    { 
      "username": "usuario", 
      "password": "senha" 
    }
    ```
  - **Resposta**: 
    - Status: `200`
    - Token JWT

- **POST /auth/logout**: Faz logout do usuário.
  - **Resposta**: 
    - Status: `200`
    - Mensagem de logout

- **PUT /auth/update/:uid**: Atualiza o perfil do usuário (inclui upload de imagem de perfil).
  - **Body**: 
    ```json
    { 
      "name": "Novo nome", 
      "profileImage": "imagem.jpg" 
    }
    ```
  - **Resposta**: 
    - Status: `200`
    - Dados atualizados do usuário

- **GET /auth/user/:uid**: Recupera o perfil de um usuário.
  - **Resposta**: 
    - Status: `200`
    - Dados do usuário

---

### **/tasks** (Tarefas)

- **GET /tasks**: Recupera todas as tarefas.
  - **Resposta**: 
    - Status: `200`
    - Lista de tarefas

- **POST /tasks**: Cria uma nova tarefa.
  - **Body**: 
    ```json
    { 
      "nome": "Tarefa", 
      "descricao": "Descrição da tarefa" 
    }
    ```
  - **Resposta**: 
    - Status: `201`
    - Dados da tarefa criada

- **PUT /tasks/:taskId**: Atualiza uma tarefa existente.
  - **Body**: 
    ```json
    { 
      "nome": "Tarefa atualizada", 
      "descricao": "Nova descrição" 
    }
    ```
  - **Resposta**: 
    - Status: `200`
    - Dados da tarefa atualizada

- **DELETE /tasks/:taskId**: Deleta uma tarefa existente.
  - **Resposta**: 
    - Status: `200`
    - Mensagem de sucesso

---

## Segurança

Para garantir a segurança da aplicação, implementamos:

- **JWT (JSON Web Tokens)**: Para autenticação.
- **Rate Limiting**: Proteção contra ataques de força bruta utilizando o `express-rate-limit`.

**Nota**: O rate limiting está comentado no código. Para ativá-lo, basta descomentar a configuração no arquivo `index.js`.

---
## Repositório da parte cliente
https://github.com/Arthur-Soares-Dev/Neurosphere

---
## Autores

- [@GregoryRodrigues](https://github.com/GregoryRFGMS)
- [@ArthurSoares](https://github.com/Arthur-Soares-Dev)
- [@Kai-Ofc](https://github.com/Kai-Ofc)
- [@DaviBMiranda](https://github.com/DaviBMiranda)
- [@Lucaswilsondev ](https://github.com/lucaswilsondev)
