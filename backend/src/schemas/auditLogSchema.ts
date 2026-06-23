export const auditLogListSchema = {
  description: "Listar logs de auditoria (ADMIN/SUPERADMIN)",
  tags: ["Audit Logs"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          userId: { type: "number" },
          action: { type: "string" },
          entity: { type: "string" },
          entityId: { type: "number" },
          details: { type: "string" },
          createdAt: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "number" },
              username: { type: "string" },
              nome: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },
    },
  },
};
