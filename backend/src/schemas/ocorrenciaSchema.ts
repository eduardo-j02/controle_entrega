export const ocorrenciaCreateSchema = {
  description: "Criar nova ocorrência (usuário autenticado)",
  tags: ["Ocorrências"],
  body: {
    type: "object",
    required: ["entregaId", "tipo", "descricao"],
    properties: {
      entregaId: { type: "number" },
      tipo: { type: "string" },
      descricao: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        entregaId: { type: "number" },
        tipo: { type: "string" },
        descricao: { type: "string" },
        data: { type: "string" },
      },
    },
  },
};

export const ocorrenciaListSchema = {
  description: "Listar todas as ocorrências",
  tags: ["Ocorrências"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          entregaId: { type: "number" },
          descricao: { type: "string" },
          status: { type: "string" },
          data: { type: "string" },
          entrega: {
            type: "object",
            properties: {
              id: { type: "number" },
              notaId: { type: "number" },
              dataEntrega: { type: "string" },
              comprovante: { type: ["string", "null"] },
              latitude: { type: ["number", "null"] },
              longitude: { type: ["number", "null"] },
              createdAt: { type: "string" },
              motoristaId: { type: ["number", "null"] },
              status: { type: "string" },
              dataFinalizacao: { type: ["string", "null"] },
              assinaturaRecebedor: { type: ["string", "null"] },
              nomeRecebedor: { type: ["string", "null"] },
              hashComprovante: { type: ["string", "null"] },
              redespacho: { type: "boolean" },
              nota: {
                type: "object",
                properties: {
                  numero: { type: "string" },
                  cliente: { type: "string" },
                },
              },
            },
          },
          fotos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                ocorrenciaId: { type: "number" },
                filename: { type: "string" },
                createdAt: { type: "string" },
              },
            },
          },
          finalizadaPorId: { type: ["number", "null"] },
          finalizadaPor: {
            type: ["object", "null"],
            properties: {
              nome: { type: "string" },
            },
          },
          protocoloErp: { type: ["string", "null"] },
          solucao: { type: ["string", "null"] },
          dataFinalizacao: { type: ["string", "null"] },
        },
      },
    },
  },
};

export const ocorrenciaGetSchema = {
  description: "Buscar ocorrência por ID",
  tags: ["Ocorrências"],
  params: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID da ocorrência" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        entregaId: { type: "number" },
        tipo: { type: "string" },
        descricao: { type: "string" },
        data: { type: "string" },
      },
    },
  },
};
