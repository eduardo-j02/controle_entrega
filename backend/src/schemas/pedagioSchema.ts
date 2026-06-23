export const pedagioImportarSchema = {
  description: "Importar base de praças de pedágio",
  tags: ["Pedágios"],
  body: {
    type: "object",
    required: ["pedagios"],
    properties: {
      pedagios: {
        type: "array",
        items: {
          type: "object",
          required: ["nome", "rodovia", "latitude", "longitude"],
          properties: {
            nome: { type: "string" },
            rodovia: { type: "string" },
            km: { type: "number" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            valorCarro: { type: "number" },
          },
        },
      },
    },
  },
};

export const pedagioProximasSchema = {
  description: "Consultar praças de pedágio próximas",
  tags: ["Pedágios"],
  querystring: {
    type: "object",
    required: ["latitude", "longitude"],
    properties: {
      latitude: { type: "number" },
      longitude: { type: "number" },
      raioKm: { type: "number" },
    },
  },
};
