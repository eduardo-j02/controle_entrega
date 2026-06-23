import { FastifyInstance } from "fastify";
import { OcorrenciaController } from "../controllers/ocorrenciaController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  ocorrenciaCreateSchema,
  ocorrenciaListSchema,
  ocorrenciaGetSchema,
} from "../schemas/ocorrenciaSchema";

export function ocorrenciaRoutes(app: FastifyInstance) {
  const controller = new OcorrenciaController();

  app.post(
    "/",
    { preHandler: authMiddleware(), schema: ocorrenciaCreateSchema },
    controller.create
  );
  app.get(
    "/",
    { preHandler: authMiddleware(), schema: ocorrenciaListSchema },
    controller.list
  );
  app.get(
    "/quantidade",
    { preHandler: authMiddleware() },
    controller.quantidade
  );
  app.get(
    "/abertas/quantidade",
    { preHandler: authMiddleware() },
    controller.quantidadeAbertas
  );
  app.get(
    "/abertas",
    { preHandler: authMiddleware() },
    controller.listarAbertas
  );
  app.get(
    "/:id",
    { preHandler: authMiddleware(), schema: ocorrenciaGetSchema },
    controller.getById
  );
  app.put("/:id/fechar", { preHandler: authMiddleware() }, controller.fechar);
}
