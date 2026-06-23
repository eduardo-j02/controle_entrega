import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { logAction } from "../services/auditLogService";
import prisma from "../lib/prisma";
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "ea2a5dce12d747b39f37471e0a94362a60bcf5c0e2bb0032eb0d9ecf577716fc";
const REFRESH_SECRET =
  process.env.REFRESH_SECRET ||
  "1d0e7590612f8d5f5273598f34c959b1a36491d3dc0796ebd87a8076487b90d4";

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const { username, password, nome, role } = request.body as any;

    // Verifica se já existe algum usuário cadastrado
    const userCount = await prisma.user.count();

    // Se já existe usuário, exige autenticação e role ADMIN/SUPERADMIN
    if (userCount > 0) {
      const reqUser = (request as any).user;

      if (!reqUser) {
        return reply
          .status(401)
          .send({ error: "Token não informado ou inválido." });
      }
      if (reqUser.role !== "ADMIN" && reqUser.role !== "SUPERADMIN") {
        return reply.status(403).send({
          error: "Apenas administradores podem criar novos usuários.",
        });
      }
    }
    const userExists = await prisma.user.findUnique({ where: { username } });
    if (userExists) {
      return reply.status(400).send({ error: "Usuário já existe." });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, nome, password: hash, role: role || "USER" },
    });
    const reqUser = (request as any).user;
    await logAction(
      reqUser?.userId || null,
      "CREATE",
      "User",
      user.id,
      `Usuário registrado: ${username}`
    );
    return reply.send({
      id: user.id,
      username: user.username,
      nome: user.nome,
      role: user.role,
      createdAt: user.createdAt,
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { username, password } = request.body as any;
    if (!username || !password) {
      return reply
        .status(400)
        .send({ error: "Usuário e senha são obrigatórios." });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return reply.status(401).send({ error: "Usuário ou senha inválidos." });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: "Usuário ou senha inválidos." });
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return reply.send({
      token,
      refreshToken,
      nome: user.nome,
      username: user.username,
      role: user.role,
      userId: user.id,
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.body as any;
    if (!refreshToken) {
      return reply.status(400).send({ error: "Refresh token é obrigatório." });
    }
    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user || user.refreshToken !== refreshToken) {
        return reply.status(401).send({ error: "Refresh token inválido." });
      }
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
      return reply.send({ token });
    } catch (err) {
      return reply.status(401).send({ error: "Token inválido ou expirado." });
    }
  }

  async ping(request: FastifyRequest, reply: FastifyReply) {
    // Apenas checa se o usuário está autenticado via middleware
    return reply.send({ ok: true });
  }
}
