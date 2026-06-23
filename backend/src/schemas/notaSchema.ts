export const notaCreateSchema = {
  description: "Criar nova nota fiscal (usuário autenticado)",
  tags: ["Notas"],
  consumes: ["multipart/form-data"],
  body: {
    type: "object",
    properties: {
      numero: { type: "string" },
      emissor: { type: "string" },
      destinatario: { type: "string" },
      dataEmissao: { type: "string" },
      arquivo: { type: "string", format: "binary" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        numero: { type: "string" },
        emissor: { type: "string" },
        destinatario: { type: "string" },
        dataEmissao: { type: "string" },
        arquivo: { type: "string" },
        createdAt: { type: "string" },
        rotaId: { type: ["number", "null"] },
        chaveXml: { type: ["string", "null"] },
      },
    },
  },
};

export const notaListSchema = {
  description: "Listar todas as notas fiscais",
  tags: ["Notas"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          numero: { type: "string" },
          emissor: { type: "string" },
          destinatario: { type: "string" },
          dataEmissao: { type: "string" },
          arquivo: { type: "string" },
          createdAt: { type: "string" },
          rotaId: { type: ["number", "null"] },
          rotaNumero: { type: ["string", "null"] },
          chaveXml: { type: ["string", "null"] },
        },
      },
    },
  },
};

export const notaGetSchema = {
  description: "Buscar nota fiscal por ID",
  tags: ["Notas"],
  params: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID da nota" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        numero: { type: "string" },
        emissor: { type: "string" },
        destinatario: { type: "string" },
        dataEmissao: { type: "string" },
        arquivo: { type: "string" },
        createdAt: { type: "string" },
        rotaId: { type: ["number", "null"] },
        chaveXml: { type: ["string", "null"] },
      },
    },
  },
};
