import { FastifyInstance } from "fastify";
import { PedagioController } from "../controllers/pedagioController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  pedagioImportarSchema,
  pedagioProximasSchema,
} from "../schemas/pedagioSchema";

export function pedagioRoutes(app: FastifyInstance) {
  const controller = new PedagioController();

  app.post(
    "/importar",
    { preHandler: authMiddleware(["ADMIN"]), schema: pedagioImportarSchema },
    controller.importar.bind(controller)
  );

  app.get(
    "/proximas",
    { preHandler: authMiddleware(), schema: pedagioProximasSchema },
    controller.proximas.bind(controller)
  );
}
