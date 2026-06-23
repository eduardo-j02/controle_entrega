export const rotaOtimizarSchema = {
  description: "Otimizar rota com OSRM e geocodificação",
  tags: ["Rotas"],
  body: {
    type: "object",
    required: ["numero", "origem"],
    properties: {
      numero: { type: "string" },
      origem: { type: "string" },
      destino: { type: "string" },
      notaIds: {
        type: "array",
        items: { type: "number" },
      },
      entregas: {
        type: "array",
        items: {
          type: "object",
          required: ["endereco"],
          properties: {
            endereco: { type: "string" },
            notaId: { type: "number" },
          },
        },
      },
    },
  },
};

export const rotaDetalhesSchema = {
  description: "Detalhes de rota otimizada por ID",
  tags: ["Rotas"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "number" },
    },
  },
};

export const rotaOtimizadasSchema = {
  description: "Lista rotas já otimizadas",
  tags: ["Rotas"],
};
