import { FastifyRequest, FastifyReply } from "fastify";
import { toZonedTime, format } from "date-fns-tz";
import { logAction } from "../services/auditLogService";
import prisma from "../lib/prisma";
const timeZone = "America/Sao_Paulo";

export class OcorrenciaController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { entregaId, descricao } = request.body as any;
    const ocorrencia = await prisma.ocorrencia.create({
      data: { entregaId, descricao },
    });
    const reqUser = (request as any).user;
    await logAction(
      reqUser?.userId || null,
      "CREATE",
      "Ocorrencia",
      ocorrencia.id,
      `Ocorrência criada`
    );
    const ocorrenciaBr = {
      ...ocorrencia,
      data: format(
        toZonedTime(ocorrencia.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
    };
    return reply.send(ocorrenciaBr);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const ocorrencias = await prisma.ocorrencia.findMany({
      include: {
        fotos: true,
        entrega: {
          include: {
            nota: { select: { numero: true, cliente: true } },
          },
        },
        finalizadaPor: { select: { nome: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const ocorrenciasBr = ocorrencias.map((ocorrencia) => ({
      id: ocorrencia.id,
      entregaId: ocorrencia.entregaId,
      descricao: ocorrencia.descricao,
      status: ocorrencia.status,
      data: format(
        toZonedTime(ocorrencia.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      entrega: ocorrencia.entrega,
      fotos: ocorrencia.fotos,
      finalizadaPorId: ocorrencia.finalizadaPorId,
      finalizadaPor: ocorrencia.finalizadaPor,
      protocoloErp: ocorrencia.protocoloErp,
      solucao: ocorrencia.solucao,
      dataFinalizacao: ocorrencia.dataFinalizacao,
    }));
    return reply.send(ocorrenciasBr);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const ocorrencia = await prisma.ocorrencia.findUnique({
      where: { id: Number(id) },
    });
    if (!ocorrencia)
      return reply.status(404).send({ error: "Ocorrência não encontrada" });
    const ocorrenciaBr = {
      ...ocorrencia,
      data: format(
        toZonedTime(ocorrencia.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
    };
    return reply.send(ocorrenciaBr);
  }

  async quantidade(request: FastifyRequest, reply: FastifyReply) {
    const total = await prisma.ocorrencia.count();
    return reply.send({ total });
  }

  async quantidadeAbertas(request: FastifyRequest, reply: FastifyReply) {
    const total = await prisma.ocorrencia.count({
      where: { status: "ABERTA" },
    });
    return reply.send({ total });
  }

  async fechar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { solucao, protocoloErp } = request.body as any;
    const reqUser = (request as any).user;
    if (
      !protocoloErp ||
      typeof protocoloErp !== "string" ||
      protocoloErp.trim().length === 0
    ) {
      return reply
        .status(400)
        .send({ error: "O ID do protocolo no ERP é obrigatório." });
    }
    const ocorrencia = await prisma.ocorrencia.findUnique({
      where: { id: Number(id) },
    });
    if (!ocorrencia) {
      return reply.status(404).send({ error: "Ocorrência não encontrada" });
    }
    if (ocorrencia.status === "FECHADA") {
      return reply.status(400).send({ error: "Ocorrência já está fechada." });
    }
    const atualizada = await prisma.ocorrencia.update({
      where: { id: Number(id) },
      data: {
        status: "FECHADA",
        finalizadaPorId: reqUser?.userId || null,
        solucao: solucao || null,
        protocoloErp,
        dataFinalizacao: new Date(),
      },
      include: { fotos: true, finalizadaPor: true },
    });
    await logAction(
      reqUser?.userId || null,
      "FECHAR_OCORRENCIA",
      "Ocorrencia",
      atualizada.id,
      `Ocorrência fechada. Protocolo: ${protocoloErp}`
    );
    return reply.send(atualizada);
  }

  async listarAbertas(request: FastifyRequest, reply: FastifyReply) {
    const ocorrencias = await prisma.ocorrencia.findMany({
      where: { status: "ABERTA" },
      include: {
        fotos: true,
        entrega: {
          include: {
            nota: { select: { numero: true, cliente: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.send(ocorrencias);
  }
}
