import { FastifyInstance } from "fastify";
import { RotaController } from "../controllers/rotaController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  rotaDetalhesSchema,
  rotaOtimizarSchema,
  rotaOtimizadasSchema,
} from "../schemas/rotaSchema";

export function rotaRoutes(app: FastifyInstance) {
  const controller = new RotaController();

  app.post(
    "/otimizar",
    { preHandler: authMiddleware(), schema: rotaOtimizarSchema },
    controller.otimizar.bind(controller)
  );

  app.get(
    "/otimizadas",
    { preHandler: authMiddleware(), schema: rotaOtimizadasSchema },
    controller.listarOtimizadas.bind(controller)
  );

  app.get(
    "/:id/detalhes",
    { preHandler: authMiddleware(), schema: rotaDetalhesSchema },
    controller.detalhes.bind(controller)
  );
}
