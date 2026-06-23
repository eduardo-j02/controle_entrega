import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { logAction } from "../services/auditLogService";
import prisma from "../lib/prisma";

export class UserController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nome: true,
        role: true,
        createdAt: true,
      },
    });
    return reply.send(users);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        nome: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user)
      return reply.status(404).send({ error: "Usuário não encontrado" });
    // Permitir que o próprio usuário veja seus dados
    const reqUser = (request as any).user;
    if (
      reqUser.role !== "ADMIN" &&
      reqUser.role !== "SUPERADMIN" &&
      reqUser.userId !== user.id
    ) {
      return reply.status(403).send({ error: "Acesso negado." });
    }
    return reply.send(user);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { nome, password, role } = request.body as any;
    const reqUser = (request as any).user;
    if (
      reqUser.role !== "ADMIN" &&
      reqUser.role !== "SUPERADMIN" &&
      reqUser.userId !== Number(id)
    ) {
      return reply.status(403).send({ error: "Acesso negado." });
    }
    const data: any = {};
    if (nome) data.nome = nome;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (role && (reqUser.role === "ADMIN" || reqUser.role === "SUPERADMIN")) data.role = role;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
      select: {
        id: true,
        username: true,
        nome: true,
        role: true,
        createdAt: true,
      },
    });
    await logAction(
      reqUser.userId,
      "UPDATE",
      "User",
      user.id,
      `Alteração: ${Object.keys(data).join(", ")}`
    );
    return reply.send(user);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const reqUser = (request as any).user;
    await prisma.user.delete({ where: { id: Number(id) } });
    await logAction(reqUser.userId, "DELETE", "User", Number(id));
    return reply.send({ success: true });
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { senhaAtual, novaSenha } = request.body as any;
    const reqUser = (request as any).user;
    if (reqUser.userId !== Number(id)) {
      return reply.status(403).send({ error: "Acesso negado." });
    }
    if (!senhaAtual || !novaSenha) {
      return reply.status(400).send({ error: "Campos obrigatórios." });
    }
    if (novaSenha.length < 6) {
      return reply
        .status(400)
        .send({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user)
      return reply.status(404).send({ error: "Usuário não encontrado" });
    const valid = await bcrypt.compare(senhaAtual, user.password);
    if (!valid) {
      return reply.status(401).send({ error: "Senha atual incorreta." });
    }
    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({
      where: { id: Number(id) },
      data: { password: hash },
    });
    await logAction(
      reqUser.userId,
      "UPDATE",
      "User",
      user.id,
      "Alteração de senha"
    );
    return reply.send({ success: true });
  }
}
