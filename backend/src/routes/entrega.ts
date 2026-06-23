import { FastifyInstance } from "fastify";
import { EntregaController } from "../controllers/entregaController";
import { authMiddleware } from "../middlewares/authMiddleware";
// import { entregaCreateSchema, entregaListSchema } from "../schemas/entregaSchema";
import {
  entregaGetSchema,
  entregaMinhasSchema,
} from "../schemas/entregaSchema";

export function entregaRoutes(app: FastifyInstance) {
  const controller = new EntregaController();

  // Rotas estáticas ANTES das rotas com parâmetros (:id)
  // para evitar que /:id capture /minhas, /exportar/pdf etc.
  app.get(
    "/minhas",
    { preHandler: authMiddleware() },
    controller.getMinhasEntregas
  );
  app.get(
    "/exportar/pdf",
    { preHandler: authMiddleware() },
    controller.exportarRelatorioPDF.bind(controller)
  );

  app.post(
    "/",
    {
      preHandler: authMiddleware(),
      // schema removido
    },
    controller.create
  );
  app.post(
    "/from-nota",
    { preHandler: authMiddleware(["ADMIN"]) },
    controller.createFromNota.bind(controller)
  );
  app.get("/", { preHandler: authMiddleware() }, controller.list);
  app.get("/:id", { preHandler: authMiddleware() }, controller.getById);
  app.put(
    "/:id/finalizar",
    {
      preHandler: authMiddleware(),
      // schema removido
    },
    controller.finalizar.bind(controller)
  );
  app.put(
    "/:id/desvincular",
    { preHandler: authMiddleware() },
    controller.desvincularMotorista.bind(controller)
  );
  app.get(
    "/:id/comprovante",
    { preHandler: authMiddleware() },
    controller.downloadComprovante.bind(controller)
  );
  app.get(
    "/:id/dossie",
    { preHandler: authMiddleware() },
    controller.exportarDossiePDF.bind(controller)
  );
  app.put(
    "/:id/transferir-redespacho",
    {
      preHandler: authMiddleware(),
      // schema removido
    },
    controller.transferirRedespacho.bind(controller)
  );
  app.put(
    "/:id/redespacho",
    { preHandler: authMiddleware(["ADMIN"]) },
    controller.updateRedespacho.bind(controller)
  );
}
