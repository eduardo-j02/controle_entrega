export const userListSchema = {
  description: "Listar todos os usuários (apenas ADMIN)",
  tags: ["Usuários"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          username: { type: "string" },
          nome: { type: "string" },
          role: { type: "string" },
          createdAt: { type: "string" },
        },
      },
    },
  },
};

export const userGetSchema = {
  description: "Buscar usuário por ID (ADMIN ou o próprio usuário)",
  tags: ["Usuários"],
  params: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID do usuário" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        username: { type: "string" },
        nome: { type: "string" },
        role: { type: "string" },
        createdAt: { type: "string" },
      },
    },
  },
};

export const userUpdateSchema = {
  description: "Editar usuário (ADMIN ou o próprio usuário)",
  tags: ["Usuários"],
  params: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID do usuário" },
    },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      nome: { type: "string" },
      password: { type: "string" },
      role: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        username: { type: "string" },
        nome: { type: "string" },
        role: { type: "string" },
        createdAt: { type: "string" },
      },
    },
  },
};

export const userDeleteSchema = {
  description: "Deletar usuário (apenas ADMIN)",
  tags: ["Usuários"],
  params: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID do usuário" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
      },
    },
  },
};
