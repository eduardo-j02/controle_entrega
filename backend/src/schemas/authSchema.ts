export const registerSchema = {
  description: "Registrar novo usuário (apenas ADMIN/SUPERADMIN)",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["username", "nome", "password"],
    properties: {
      username: { type: "string" },
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

export const loginSchema = {
  description: "Login do usuário",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["username", "password"],
    properties: {
      username: { type: "string" },
      password: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        token: { type: "string" },
        refreshToken: { type: "string" },
        nome: { type: "string" },
        username: { type: "string" },
        role: { type: "string" },
        userId: { type: "number" },
      },
    },
  },
};

export const refreshSchema = {
  description: "Renovar access token usando refresh token",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        token: { type: "string" },
      },
    },
  },
};
