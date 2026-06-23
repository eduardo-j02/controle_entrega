import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "ea2a5dce12d747b39f37471e0a94362a60bcf5c0e2bb0032eb0d9ecf577716fc";

export function authMiddleware(roles: string[] = []) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Token não informado." });
    }
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      // SUPERADMIN tem acesso irrestrito
      if (payload.role === "SUPERADMIN") {
        (request as any).user = payload;
        return;
      }
      if (roles.length > 0 && !roles.includes(payload.role)) {
        return reply.status(403).send({ error: "Acesso negado." });
      }
      (request as any).user = payload;
    } catch (err) {
      return reply.status(401).send({ error: "Token inválido ou expirado." });
    }
  };
}
