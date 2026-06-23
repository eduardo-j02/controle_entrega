import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middlewares/authMiddleware";
import { auditLogListSchema } from "../schemas/auditLogSchema";
import prisma from "../lib/prisma";

export function auditLogRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: authMiddleware(["ADMIN", "SUPERADMIN"]),
      schema: auditLogListSchema,
    },
    async (request, reply) => {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, nome: true, role: true },
          },
        },
      });
      return reply.send(logs);
    }
  );
}
