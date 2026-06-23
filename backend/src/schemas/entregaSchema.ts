export const entregaCreateSchema = {
  description: "Criar nova entrega (usuário autenticado)",
  tags: ["Entregas"],
  consumes: ["multipart/form-data"],
  body: {
    type: "object",
    properties: {
      notaId: { oneOf: [{ type: "number" }, { type: "string" }] },
      dataEntrega: { type: "string" },
      comprovante: { type: "string", format: "binary" },
      latitude: { type: "number" },
      longitude: { type: "number" },
      redespacho: {
        type: "boolean",
        description: "Se true, permite múltiplos motoristas (redespacho)",
      },
      motoristas: {
        type: "array",
        items: { type: "number" },
        description: "Lista de IDs dos motoristas em ordem de redespacho",
      },
    },
    required: ["notaId", "dataEntrega"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        notaId: { type: "number" },
        dataEntrega: { type: "string" },
        comprovante: { type: ["string", "null"] },
        hashComprovante: { type: ["string", "null"] },
        latitude: { type: ["number", "null"] },
        longitude: { type: ["number", "null"] },
        status: { type: "string" },
        motoristaId: { type: ["number", "null"] },
        rotaId: { type: ["number", "null"] },
        dataFinalizacao: { type: ["string", "null"] },
        createdAt: { type: "string" },
        redespacho: { type: "boolean" },
        motoristas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              nome: { type: "string" },
              ordem: { type: "number" },
            },
          },
        },
      },
    },
  },
};

export const entregaListSchema = {
  description: "Listar todas as entregas",
  tags: ["Entregas"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          notaId: { type: "number" },
          dataEntrega: { type: "string" },
          comprovante: { type: ["string", "null"] },
          hashComprovante: { type: ["string", "null"] },
          latitude: { type: ["number", "null"] },
          longitude: { type: ["number", "null"] },
          status: { type: "string" },
          motoristaId: { type: ["number", "null"] },
          rotaId: { type: ["number", "null"] },
          dataFinalizacao: { type: ["string", "null"] },
          createdAt: { type: "string" },
        },
      },
    },
  },
};

export const entregaGetSchema = {
  description: "Buscar entrega por ID",
  tags: ["Entregas"],
  params: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID da entrega" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        notaId: { type: "number" },
        dataEntrega: { type: "string" },
        comprovante: { type: ["string", "null"] },
        hashComprovante: { type: ["string", "null"] },
        latitude: { type: ["number", "null"] },
        longitude: { type: ["number", "null"] },
        status: { type: "string" },
        motoristaId: { type: ["number", "null"] },
        rotaId: { type: ["number", "null"] },
        dataFinalizacao: { type: ["string", "null"] },
        createdAt: { type: "string" },
      },
    },
  },
};

export const entregaMinhasSchema = {
  description: "Listar entregas do motorista autenticado",
  tags: ["Entregas"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          chaveNfe: { type: ["string", "null"] },
          numero: { type: ["string", "null"] },
          cliente: { type: ["string", "null"] },
          dataEmissao: { type: ["string", "null"], format: "date-time" },
          status: { type: "string" },
          dataFinalizacao: { type: ["string", "null"], format: "date-time" },
        },
      },
    },
  },
};
