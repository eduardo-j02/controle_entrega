import { FastifyInstance } from "fastify";
import { NotaController } from "../controllers/notaController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  notaCreateSchema,
  notaListSchema,
  notaGetSchema,
} from "../schemas/notaSchema";

export function notaRoutes(app: FastifyInstance) {
  const controller = new NotaController();

  app.post(
    "/",
    { preHandler: authMiddleware(), schema: notaCreateSchema },
    controller.create
  );
  app.get(
    "/",
    { preHandler: authMiddleware(), schema: notaListSchema },
    controller.list
  );
  app.get(
    "/:id",
    { preHandler: authMiddleware(), schema: notaGetSchema },
    controller.getById
  );
  app.post(
    "/rota",
    { preHandler: authMiddleware() },
    controller.createByRota.bind(controller)
  );
  app.get(
    "/rotas",
    { preHandler: authMiddleware() },
    controller.listRotasComNotas.bind(controller)
  );
  app.get(
    "/chave/:chave",
    { preHandler: authMiddleware() },
    controller.getByChaveXml.bind(controller)
  );
  app.get(
    "/:id/pdf",
    { preHandler: authMiddleware() },
    controller.downloadPdf.bind(controller)
  );
  app.get(
    "/:id/arquivo",
    { preHandler: authMiddleware() },
    controller.downloadArquivo.bind(controller)
  );
  app.put(
    "/rotas/:id/redespacho",
    { preHandler: authMiddleware(["ADMIN"]) },
    controller.updateRota.bind(controller)
  );
  app.put(
    "/:id/redespacho",
    { preHandler: authMiddleware(["ADMIN"]) },
    controller.updateRedespacho.bind(controller)
  );
}
