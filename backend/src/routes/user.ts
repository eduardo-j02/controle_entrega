import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  userListSchema,
  userGetSchema,
  userUpdateSchema,
  userDeleteSchema,
} from "../schemas/userSchema";

export function userRoutes(app: FastifyInstance) {
  const controller = new UserController();

  app.get(
    "/",
    { preHandler: authMiddleware(["ADMIN"]), schema: userListSchema },
    controller.list
  );
  app.get(
    "/:id",
    { preHandler: authMiddleware(["ADMIN", "USER"]), schema: userGetSchema },
    controller.getById
  );
  app.put(
    "/:id",
    { preHandler: authMiddleware(["ADMIN", "USER"]), schema: userUpdateSchema },
    controller.update
  );
  app.delete(
    "/:id",
    { preHandler: authMiddleware(["ADMIN"]), schema: userDeleteSchema },
    controller.delete
  );
  app.patch(
    "/:id/senha",
    {
      preHandler: authMiddleware(["USER", "ADMIN"]),
      schema: {
        description: "Alterar senha do usuário (próprio usuário)",
        tags: ["Usuários"],
        params: {
          type: "object",
          properties: { id: { type: "number", description: "ID do usuário" } },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            senhaAtual: { type: "string" },
            novaSenha: { type: "string" },
          },
          required: ["senhaAtual", "novaSenha"],
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
          },
        },
      },
    },
    controller.changePassword
  );
}
