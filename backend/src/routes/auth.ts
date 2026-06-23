import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../schemas/authSchema";

export function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  // /register não usa preHandler: o controller já verifica se é primeiro usuário
  // (sem token) ou exige ADMIN/SUPERADMIN para usuários subsequentes
  app.post(
    "/register",
    {
      schema: registerSchema,
    },
    controller.register
  );
  app.post("/login", { schema: loginSchema }, controller.login);
  app.post("/refresh", { schema: refreshSchema }, controller.refresh);
  app.get("/ping", { preHandler: authMiddleware() }, controller.ping);
}
