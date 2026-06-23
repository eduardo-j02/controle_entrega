import { FastifyRequest, FastifyReply } from "fastify";
import { join } from "path";
import { createWriteStream, existsSync, mkdirSync, createReadStream } from "fs";
import { randomUUID } from "crypto";
import { toZonedTime, format } from "date-fns-tz";
import { logAction } from "../services/auditLogService";
import { createHash } from "crypto";
import PDFDocument from "pdfkit";
import { GeocodingServiceFactory } from "../services/geocodingService";
import { StaticMapServiceFactory } from "../services/staticMapService";
import prisma from "../lib/prisma";
const timeZone = "America/Sao_Paulo";

export class EntregaController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const fields: Record<string, any> = {};
    let comprovanteFilename = "";
    let comprovanteHash: string | undefined;
    for await (const part of request.parts()) {
      if (part.type === "file" && part.fieldname === "comprovante") {
        const safeFilename = `${randomUUID()}_${part.filename}`;
        comprovanteFilename = safeFilename;
        const dirPath = join(__dirname, "../../uploads/entregas");
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
        }
        const uploadPath = join(dirPath, safeFilename);
        // Validação de tipo e tamanho
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const allowedExts = [".jpg", ".jpeg", ".png", ".pdf"];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const ext = part.filename
          .slice(part.filename.lastIndexOf("."))
          .toLowerCase();
        if (
          !allowedTypes.includes(part.mimetype) ||
          !allowedExts.includes(ext)
        ) {
          return reply.status(400).send({
            error: "Tipo de arquivo não permitido. Envie JPG, PNG ou PDF.",
          });
        }
        let fileSize = 0;
        const hash = createHash("sha256");
        part.file.on("data", (chunk) => {
          fileSize += chunk.length;
          hash.update(chunk);
        });
        await new Promise((resolve, reject) => {
          part.file
            .pipe(createWriteStream(uploadPath))
            .on("finish", () => {
              if (fileSize > maxSize) {
                return reject(
                  new Error("Arquivo excede o tamanho máximo de 5MB.")
                );
              }
              resolve(null);
            })
            .on("error", reject);
        }).catch((err) => {
          return reply.status(400).send({ error: err.message });
        });
        comprovanteHash = hash.digest("hex");
      } else if (part.type === "field") {
        fields[part.fieldname] = part.value;
      }
    }

    const { notaId, dataEntrega, latitude, longitude, redespacho, motoristas } =
      fields;
    if (!notaId || !dataEntrega) {
      return reply.status(400).send({ error: "Campos obrigatórios faltando" });
    }
    const reqUser = (request as any).user;

    // Buscar o valor de redespacho da nota
    const nota = await prisma.nota.findUnique({
      where: { id: Number(notaId) },
    });

    // NOVA REGRA: Só pode existir uma entrega ativa por nota
    const entregaExistente = (await prisma.entrega.findFirst({
      where: { notaId: Number(notaId) },
    })) as import("@prisma/client").Entrega | null;

    if (entregaExistente) {
      // Se for redespacho, permitir adicionar novo motorista conforme regras
      if (nota?.redespacho) {
        // Verifica se a entrega já foi finalizada
        if (
          (entregaExistente.status && entregaExistente.status === "Entregue") ||
          entregaExistente.comprovante
        ) {
          return reply.status(400).send({
            error:
              "Esta entrega já foi finalizada. Não é possível adicionar novo motorista.",
          });
        }
        // Busca motoristas já vinculados
        const motoristasExistentes = await prisma.entregaMotorista.findMany({
          where: { entregaId: entregaExistente.id },
          orderBy: { ordem: "asc" },
        });
        // Só permite adicionar novo motorista se o anterior já transferiu
        if (motoristasExistentes.length > 0) {
          const ultimo = motoristasExistentes[motoristasExistentes.length - 1];
          if (!ultimo.dataTransferencia) {
            return reply.status(400).send({
              error: "O motorista anterior ainda não transferiu a entrega.",
            });
          }
        }
        // Adiciona novo motorista à entrega existente
        const novoMotoristaId = reqUser?.userId;
        const jaVinculado = motoristasExistentes.some(
          (m) => m.motoristaId === novoMotoristaId
        );
        if (jaVinculado) {
          return reply
            .status(400)
            .send({ error: "Este motorista já está vinculado à entrega." });
        }
        await prisma.entregaMotorista.create({
          data: {
            entregaId: entregaExistente.id,
            motoristaId: novoMotoristaId,
            ordem: motoristasExistentes.length + 1,
          },
        });
        await logAction(
          novoMotoristaId || null,
          "VINCULAR_MOTORISTA_REDESPACHO",
          "Entrega",
          entregaExistente.id,
          `Motorista ${novoMotoristaId} vinculado ao redespacho (ordem ${
            motoristasExistentes.length + 1
          })`
        );
        // Retorna a entrega existente já atualizada
        const entregaAtualizada = await prisma.entrega.findUnique({
          where: { id: entregaExistente.id },
          include: {
            motoristas: {
              include: { motorista: true },
              orderBy: { ordem: "asc" },
            },
          },
        });
        return reply.send(entregaAtualizada);
      } else {
        // Não permite múltiplas entregas para a mesma nota
        return reply.status(400).send({
          error:
            "Já existe uma entrega para esta nota. Não é permitido criar múltiplas entregas para a mesma nota.",
        });
      }
    }

    // Se for redespacho, criar entrega sem motoristaId e vincular motoristas na ordem
    let entrega;
    if (redespacho === "true" || redespacho === true) {
      if (!Array.isArray(motoristas) || motoristas.length < 2) {
        return reply.status(400).send({
          error:
            "Para redespacho, informe pelo menos dois motoristas em ordem.",
        });
      }
      entrega = await prisma.entrega.create({
        data: {
          notaId: Number(notaId),
          dataEntrega: new Date(dataEntrega),
          comprovante: comprovanteFilename || undefined,
          hashComprovante: comprovanteHash,
          latitude:
            latitude !== undefined && latitude !== ""
              ? Number(latitude)
              : undefined,
          longitude:
            longitude !== undefined && longitude !== ""
              ? Number(longitude)
              : undefined,
          status: "Pendente",
          redespacho: true, // Mantém true pois é fluxo explícito de redespacho
        },
      });
      // motoristas pode vir como string (csv) ou array
      let listaMotoristas: number[] = (
        Array.isArray(motoristas)
          ? motoristas
          : String(motoristas).split(",")
      )
        .map((m: any) => Number(m))
        .filter((n: number) => Number.isInteger(n) && n > 0);

      if (listaMotoristas.length < 2) {
        return reply.status(400).send({
          error: "Para redespacho, informe pelo menos dois motoristas válidos.",
        });
      }
      for (let i = 0; i < listaMotoristas.length; i++) {
        await prisma.entregaMotorista.create({
          data: {
            entregaId: entrega.id,
            motoristaId: Number(listaMotoristas[i]),
            ordem: i + 1,
          },
        });
      }
      await logAction(
        reqUser?.userId || null,
        "CREATE",
        "Entrega",
        entrega.id,
        `Entrega criada com redespacho para nota ${notaId} por motoristas: ${listaMotoristas.join(
          ","
        )}`
      );
    } else {
      // Regra: a mesma nota não pode ser vinculada mais de uma vez para o mesmo motorista
      const entregaExistente = await prisma.entrega.findFirst({
        where: {
          notaId: Number(notaId),
          motoristaId: reqUser?.userId,
        },
      });
      if (entregaExistente) {
        return reply
          .status(400)
          .send({ error: "Esta nota já está vinculada a este motorista." });
      }
      entrega = await prisma.entrega.create({
        data: {
          notaId: Number(notaId),
          dataEntrega: new Date(dataEntrega),
          comprovante: comprovanteFilename || undefined,
          hashComprovante: comprovanteHash,
          latitude:
            latitude !== undefined && latitude !== ""
              ? Number(latitude)
              : undefined,
          longitude:
            longitude !== undefined && longitude !== ""
              ? Number(longitude)
              : undefined,
          motoristaId: reqUser?.userId,
          status: "Pendente",
          redespacho: nota?.redespacho ?? false, // HERDA O VALOR DA NOTA
        },
      });
      // NOVO: criar registro em EntregaMotorista para entregas simples
      await prisma.entregaMotorista.create({
        data: {
          entregaId: entrega.id,
          motoristaId: reqUser?.userId,
          ordem: 1,
        },
      });
      await logAction(
        reqUser?.userId || null,
        "CREATE",
        "Entrega",
        entrega.id,
        `Entrega criada para nota ${notaId} por motorista ${
          reqUser?.userId
        }. Comprovante: ${comprovanteFilename || "nenhum"}, Hash: ${
          comprovanteHash || "nenhum"
        }`
      );
    }
    // Buscar motoristas vinculados (se redespacho)
    let motoristasVinculados: { id: number; nome: string; ordem: number }[] =
      [];
    if (entrega.redespacho) {
      const vincs = await prisma.entregaMotorista.findMany({
        where: { entregaId: entrega.id },
        include: { motorista: { select: { id: true, nome: true } } },
        orderBy: { ordem: "asc" },
      });
      motoristasVinculados = vincs.map((v) => ({
        id: v.motorista.id,
        nome: v.motorista.nome,
        ordem: v.ordem,
      }));
    } else if (entrega.motoristaId) {
      const m = await prisma.user.findUnique({
        where: { id: entrega.motoristaId },
      });
      if (m) motoristasVinculados = [{ id: m.id, nome: m.nome, ordem: 1 }];
    }
    const entregaBr = {
      ...entrega,
      dataEntrega: format(
        toZonedTime(entrega.dataEntrega, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      createdAt: format(
        toZonedTime(entrega.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      motoristas: motoristasVinculados,
    };
    return reply.send(entregaBr);
  }

  async createFromNota(request: FastifyRequest, reply: FastifyReply) {
    const { notaId, redespacho } = request.body as any;

    if (!notaId || typeof redespacho !== "boolean") {
      return reply
        .status(400)
        .send({ error: "notaId e redespacho obrigatórios" });
    }
    let entrega = await prisma.entrega.findFirst({
      where: { notaId: Number(notaId) },
    });
    if (entrega) {
      entrega = await prisma.entrega.update({
        where: { id: entrega.id },
        data: { redespacho },
      });

      return reply.send(entrega);
    }
    try {
      entrega = await prisma.entrega.create({
        data: {
          notaId: Number(notaId),
          dataEntrega: new Date(),
          status: "Pendente",
          redespacho,
        },
      });

      return reply.send(entrega);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[createFromNota] Erro ao criar entrega:", err);
      return reply
        .status(500)
        .send({ error: "Erro ao criar entrega", details: errorMsg });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const entregas = await prisma.entrega.findMany({
      include: {
        nota: {
          select: {
            numero: true,
            cliente: true,
            rota: { select: { numero: true } },
          },
        },
        motorista: { select: { nome: true } },
        motoristas: {
          include: { motorista: { select: { id: true, nome: true } } },
          orderBy: { ordem: "asc" },
        },
      },
    });
    const entregasBr = entregas.map((entrega) => ({
      id: entrega.id,
      cliente: entrega.nota?.cliente || "-",
      numeroNF: entrega.nota?.numero || "-",
      dataEntrega: entrega.dataEntrega
        ? format(
            toZonedTime(entrega.dataEntrega, timeZone),
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            { timeZone }
          )
        : "-",
      numeroRota: entrega.nota?.rota?.numero || "-",
      nomeMotorista: entrega.motorista?.nome || "-",
      motoristas: entrega.motoristas.map((m) => ({
        id: m.motorista.id,
        nome: m.motorista.nome,
        ordem: m.ordem,
        dataTransferencia: m.dataTransferencia,
      })),
      status: entrega.status,
      comprovante: entrega.comprovante,
      latitude: entrega.latitude,
      longitude: entrega.longitude,
      createdAt: entrega.createdAt
        ? format(
            toZonedTime(entrega.createdAt, timeZone),
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            { timeZone }
          )
        : "-",
      dataFinalizacao: entrega.dataFinalizacao
        ? format(
            toZonedTime(entrega.dataFinalizacao, timeZone),
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            { timeZone }
          )
        : null,
      redespacho: entrega.redespacho || false,
    }));
    return reply.send(entregasBr);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const entrega = await prisma.entrega.findUnique({
      where: { id: Number(id) },
      include: {
        ocorrencias: {
          include: { fotos: true },
        },
      },
    });
    if (!entrega)
      return reply.status(404).send({ error: "Entrega não encontrada" });
    const entregaBr = {
      ...entrega,
      dataEntrega: format(
        toZonedTime(entrega.dataEntrega, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      createdAt: format(
        toZonedTime(entrega.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
    };
    return reply.send(entregaBr);
  }

  async getMinhasEntregas(request: FastifyRequest, reply: FastifyReply) {
    const reqUser = (request as any).user;
    if (!reqUser?.userId) {
      return reply.status(401).send({ error: "Não autenticado" });
    }
    // Buscar entregas onde o usuário é motorista principal OU está vinculado em EntregaMotorista
    const entregas = await prisma.entrega.findMany({
      where: {
        OR: [
          { motoristaId: reqUser.userId },
          { motoristas: { some: { motoristaId: reqUser.userId } } },
        ],
      },
      include: {
        nota: {
          select: {
            chaveXml: true,
            numero: true,
            cliente: true,
            destinatario: true,
            dataEmissao: true,
          },
        },
        motoristas: {
          include: { motorista: { select: { id: true, nome: true } } },
          orderBy: { ordem: "asc" },
        },
      },
      orderBy: { dataEntrega: "desc" },
    });

    const lista = entregas.map((e) => ({
      id: e.id,
      chaveNfe: e.nota?.chaveXml,
      numero: e.nota?.numero,
      cliente: e.nota?.cliente || e.nota?.destinatario,
      dataEmissao: e.nota?.dataEmissao,
      status: e.status,
      dataFinalizacao: e.dataFinalizacao,
      redespacho: e.redespacho || false,
      motoristas: Array.isArray(e.motoristas)
        ? e.motoristas.map((m) => ({
            id: m.motorista.id,
            nome: m.motorista.nome,
            ordem: m.ordem,
            dataTransferencia: m.dataTransferencia,
          }))
        : [],
    }));
    return reply.send(lista);
  }

  async finalizar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      let comprovanteFilename = "";
      let latitude: number | undefined;
      let longitude: number | undefined;
      let comprovanteHash: string | undefined;
      let nomeRecebedor: string | undefined;
      // NOVO: ocorrência
      let ocorrenciaDescricao: string | undefined;
      const ocorrenciaFotos: { filename: string; original: string }[] = [];
      for await (const part of request.parts()) {
        if (part.type === "file" && part.fieldname === "comprovante") {
          const safeFilename = `${randomUUID()}_${part.filename}`;
          comprovanteFilename = safeFilename;
          const dirPath = join(__dirname, "../../uploads/entregas");
          if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
          }
          const uploadPath = join(dirPath, safeFilename);
          // Validação de tipo e tamanho
          const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
          const allowedExts = [".jpg", ".jpeg", ".png", ".pdf"];
          const maxSize = 5 * 1024 * 1024; // 5MB
          const ext = part.filename
            .slice(part.filename.lastIndexOf("."))
            .toLowerCase();
          if (
            !allowedTypes.includes(part.mimetype) ||
            !allowedExts.includes(ext)
          ) {
            console.error(
              "[Entrega] Tipo de arquivo não permitido:",
              part.mimetype,
              ext
            );
            return reply.status(400).send({
              error: "Tipo de arquivo não permitido. Envie JPG, PNG ou PDF.",
            });
          }
          let fileSize = 0;
          const hash = createHash("sha256");
          part.file.on("data", (chunk) => {
            fileSize += chunk.length;
            hash.update(chunk);
          });
          await new Promise((resolve, reject) => {
            part.file
              .pipe(createWriteStream(uploadPath))
              .on("finish", () => {
                if (fileSize > maxSize) {
                  return reject(
                    new Error("Arquivo excede o tamanho máximo de 5MB.")
                  );
                }
                resolve(null);
              })
              .on("error", (err) => {
                console.error("[Entrega] Erro ao salvar arquivo:", err);
                reject(err);
              });
          }).catch((err) => {
            console.error("[Entrega] Erro no upload:", err);
            return reply.status(400).send({ error: err.message });
          });
          comprovanteHash = hash.digest("hex");
        } else if (
          part.type === "file" &&
          part.fieldname.startsWith("ocorrenciaFoto")
        ) {
          // Salvar foto da ocorrência
          const safeFilename = `${randomUUID()}_${part.filename}`;
          const dirPath = join(__dirname, "../../uploads/ocorrencias");
          if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
          }
          const uploadPath = join(dirPath, safeFilename);
          // Validação de tipo e tamanho
          const allowedTypes = ["image/jpeg", "image/png"];
          const allowedExts = [".jpg", ".jpeg", ".png"];
          const maxSize = 5 * 1024 * 1024; // 5MB
          const ext = part.filename
            .slice(part.filename.lastIndexOf("."))
            .toLowerCase();
          if (
            !allowedTypes.includes(part.mimetype) ||
            !allowedExts.includes(ext)
          ) {
            console.error(
              "[Ocorrencia] Tipo de arquivo não permitido:",
              part.mimetype,
              ext
            );
            continue;
          }
          let fileSize = 0;
          part.file.on("data", (chunk) => {
            fileSize += chunk.length;
          });
          await new Promise((resolve, reject) => {
            part.file
              .pipe(createWriteStream(uploadPath))
              .on("finish", () => {
                if (fileSize > maxSize) {
                  return reject(
                    new Error("Arquivo excede o tamanho máximo de 5MB.")
                  );
                }
                resolve(null);
              })
              .on("error", (err) => {
                console.error("[Ocorrencia] Erro ao salvar arquivo:", err);
                reject(err);
              });
          }).catch((err) => {
            console.error("[Ocorrencia] Erro no upload:", err);
          });
          ocorrenciaFotos.push({
            filename: safeFilename,
            original: part.filename,
          });
        } else if (part.type === "field") {
          if (part.fieldname === "latitude") latitude = Number(part.value);
          if (part.fieldname === "longitude") longitude = Number(part.value);
          if (part.fieldname === "nomeRecebedor")
            nomeRecebedor =
              typeof part.value === "string"
                ? part.value
                : String(part.value ?? "");
          // NOVO: ocorrência
          if (part.fieldname === "ocorrenciaDescricao") {
            ocorrenciaDescricao =
              typeof part.value === "string"
                ? part.value
                : String(part.value ?? "");
          }
        }
      }
      if (!comprovanteFilename) {
        console.error("[Entrega] Comprovante não enviado");
        return reply.status(400).send({
          error: "Comprovante é obrigatório para finalizar a entrega.",
        });
      }
      // Bloqueio: não permitir finalizar entrega já finalizada
      const entregaAtual = await prisma.entrega.findUnique({
        where: { id: Number(id) },
        include: { motoristas: true },
      });
      if (!entregaAtual) {
        console.error("[Entrega] Entrega não encontrada", id);
        return reply.status(404).send({ error: "Entrega não encontrada" });
      }
      if (entregaAtual.status === "Entregue") {
        return reply
          .status(400)
          .send({ error: "Entrega já finalizada. Não é possível alterar." });
      }
      // Se for redespacho, só o último motorista pode finalizar
      if (entregaAtual.redespacho) {
        const reqUser = (request as any).user;
        const motoristas = entregaAtual.motoristas;
        if (!motoristas || motoristas.length === 0) {
          return reply
            .status(400)
            .send({ error: "Redespacho sem motoristas vinculados." });
        }
        // Último da ordem
        const ordemMax = Math.max(...motoristas.map((m) => m.ordem));
        const vinc = motoristas.find((m) => m.motoristaId === reqUser.userId);
        if (!vinc || vinc.ordem !== ordemMax) {
          return reply.status(403).send({
            error:
              "Apenas o último motorista do redespacho pode finalizar a entrega.",
          });
        }
        // Todos os anteriores já transferiram?
        const anteriores = motoristas.filter((m) => m.ordem < ordemMax);
        if (anteriores.some((m) => !m.dataTransferencia)) {
          return reply.status(403).send({
            error:
              "Todos os motoristas anteriores devem transferir antes da finalização.",
          });
        }
      } else {
        // Para entrega simples, só o motorista dono ou ADMIN/SUPERADMIN pode finalizar
        const reqUser = (request as any).user;
        if (
          reqUser.role !== "ADMIN" &&
          reqUser.role !== "SUPERADMIN" &&
          entregaAtual.motoristaId !== reqUser.userId
        ) {
          return reply.status(403).send({
            error: "Você não tem permissão para finalizar esta entrega.",
          });
        }
      }
      const entrega = await prisma.entrega.update({
        where: { id: Number(id) },
        data: {
          comprovante: comprovanteFilename,
          hashComprovante: comprovanteHash,
          status: "Entregue",
          latitude,
          longitude,
          nomeRecebedor,
          dataFinalizacao: new Date(),
        },
      });
      // NOVO: salvar ocorrência e fotos
      if (ocorrenciaDescricao) {
        const ocorrencia = await prisma.ocorrencia.create({
          data: {
            entregaId: entrega.id,
            descricao: ocorrenciaDescricao,
          },
        });
        for (const foto of ocorrenciaFotos) {
          await prisma.ocorrenciaFoto.create({
            data: {
              ocorrenciaId: ocorrencia.id,
              filename: foto.filename,
            },
          });
        }
      }
      await logAction(
        (request as any).user?.userId || null,
        "UPDATE",
        "Entrega",
        entrega.id,
        `Entrega finalizada. Comprovante: ${comprovanteFilename}, Hash: ${comprovanteHash}, Localização: ${
          latitude ?? "-"
        },${longitude ?? "-"} Data: ${entrega.dataFinalizacao}`
      );
      return reply.send({ success: true, entrega });
    } catch (err: any) {
      console.error("[Entrega] Erro inesperado ao finalizar:", err);
      return reply.status(500).send({
        error: "Erro interno ao finalizar entrega.",
        details: err?.message || err,
      });
    }
  }

  async desvincularMotorista(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const entrega = await prisma.entrega.findUnique({
      where: { id: Number(id) },
    });
    if (!entrega) {
      return reply.status(404).send({ error: "Entrega não encontrada" });
    }
    if (entrega.status === "Entregue") {
      return reply.status(400).send({
        error: "Entrega já finalizada. Não pode ser desvinculada/removida.",
      });
    }
    await prisma.entrega.delete({
      where: { id: Number(id) },
    });
    await logAction(
      (request as any).user?.userId || null,
      "DELETE",
      "Entrega",
      entrega.id,
      `Entrega desvinculada/deletada. Motorista anterior: ${
        entrega.motoristaId ?? "-"
      } Nota: ${entrega.notaId}`
    );
    return reply.send({ success: true });
  }

  async downloadComprovante(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const entrega = await prisma.entrega.findUnique({
      where: { id: Number(id) },
    });
    if (!entrega || !entrega.comprovante) {
      return reply.status(404).send({ error: "Comprovante não encontrado." });
    }
    const filePath = join(
      __dirname,
      "../../uploads/entregas",
      entrega.comprovante
    );
    if (!existsSync(filePath)) {
      return reply.status(404).send({ error: "Arquivo não encontrado." });
    }
    reply.header(
      "Content-Disposition",
      `attachment; filename=${entrega.comprovante}`
    );
    return reply.send(createReadStream(filePath));
  }

  async exportarRelatorioPDF(request: FastifyRequest, reply: FastifyReply) {
    const entregas = await prisma.entrega.findMany({
      include: {
        nota: true,
        motorista: true,
      },
    });
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      "attachment; filename=relatorio_entregas.pdf"
    );
    doc.fontSize(18).text("Relatório de Entregas", { align: "center" });
    doc.moveDown();
    entregas.forEach((e, idx) => {
      doc.fontSize(12).text(`Entrega #${e.id}`);
      doc.text(
        `Nota: ${e.nota?.numero || "-"} | Cliente: ${
          e.nota?.cliente || "-"
        } | Motorista: ${e.motorista?.nome || "-"}`
      );
      doc.text(
        `Status: ${e.status} | Data Entrega: ${
          e.dataEntrega ? new Date(e.dataEntrega).toLocaleString() : "-"
        }`
      );
      doc.text(
        `Data Finalização: ${
          e.dataFinalizacao ? new Date(e.dataFinalizacao).toLocaleString() : "-"
        }`
      );
      doc.text(
        `Latitude: ${e.latitude ?? "-"} | Longitude: ${e.longitude ?? "-"}`
      );
      doc.text(
        `Comprovante: ${e.comprovante ?? "-"} | Hash: ${
          e.hashComprovante ?? "-"
        }`
      );
      doc.moveDown();
      if ((idx + 1) % 5 === 0) doc.addPage();
    });
    doc.end();
    return reply.send(doc);
  }

  async exportarDossiePDF(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const entrega = await prisma.entrega.findUnique({
      where: { id: Number(id) },
      include: {
        nota: true,
        motorista: true,
      },
    });
    if (!entrega) {
      return reply.status(404).send({ error: "Entrega não encontrada" });
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      "attachment; filename=dossie_entrega.pdf"
    );

    // Buscar histórico de motoristas (redespacho)
    const motoristas = await prisma.entregaMotorista.findMany({
      where: { entregaId: entrega.id },
      include: { motorista: { select: { nome: true } } },
      orderBy: { ordem: "asc" },
    });

    // Determinar motorista do cabeçalho
    let nomeMotoristaCabecalho = entrega.motorista?.nome || "-";
    if (motoristas.length > 0) {
      if (entrega.status === "Entregue") {
        nomeMotoristaCabecalho =
          motoristas[motoristas.length - 1].motorista.nome;
      } else {
        // Em posse
        const idxAtual = motoristas.findIndex((m) => !m.dataTransferencia);
        if (idxAtual >= 0) {
          nomeMotoristaCabecalho = motoristas[idxAtual].motorista.nome;
        }
      }
    }

    // Cabeçalho
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Dossiê Completo da Entrega", { align: "center" });
    doc.moveDown();

    // Dados principais
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Data de Entrega:", { continued: true });
    doc
      .font("Helvetica")
      .text(
        ` ${
          entrega.dataFinalizacao
            ? new Date(entrega.dataFinalizacao).toLocaleString()
            : "-"
        }`
      );
    doc.font("Helvetica-Bold").text("Motorista:", { continued: true });
    doc.font("Helvetica").text(` ${nomeMotoristaCabecalho}`);
    doc.font("Helvetica-Bold").text("Nome do Recebedor:", { continued: true });
    doc.font("Helvetica").text(` ${entrega.nomeRecebedor || "-"}`);
    doc
      .font("Helvetica-Bold")
      .text("Hash do Comprovante:", { continued: true });
    doc.font("Helvetica").text(` ${entrega.hashComprovante ?? "-"}`);
    doc.moveDown();

    // Endereço (simplificado)
    let endereco: string | undefined = undefined;
    let mapaBuffer: Buffer | undefined = undefined;
    if (entrega.latitude && entrega.longitude) {
      try {
        const geocodingService = GeocodingServiceFactory.create();
        const staticMapService = StaticMapServiceFactory.create();
        const enderecoResult = await geocodingService.getAddressFromCoordinates(
          entrega.latitude,
          entrega.longitude
        );
        endereco = enderecoResult || undefined;
        mapaBuffer = await staticMapService.getMapBuffer(
          entrega.latitude,
          entrega.longitude,
          520,
          140,
          16
        );
      } catch (error) {
        console.error("Erro ao carregar mapa:", error);
        endereco = undefined;
        mapaBuffer = undefined;
      }
    }

    if (endereco) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Localização da Entrega", { underline: true });
      doc.font("Helvetica").fontSize(12);
      const enderecoSimples = endereco.split(",").slice(0, 3).join(",").trim();
      doc.text(enderecoSimples);
      doc.moveDown();
    }

    // Nota fiscal vinculada
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Dados da Nota Fiscal", { underline: true });
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Número NF:", { continued: true });
    doc.font("Helvetica").text(` ${entrega.nota?.numero || "-"}`);
    doc.font("Helvetica-Bold").text("Chave NFe:", { continued: true });
    doc.font("Helvetica").text(` ${entrega.nota?.chaveXml || "-"}`);
    doc.font("Helvetica-Bold").text("Cliente:", { continued: true });
    doc
      .font("Helvetica")
      .text(` ${entrega.nota?.cliente || entrega.nota?.destinatario || "-"}`);
    doc.font("Helvetica-Bold").text("Data de Emissão:", { continued: true });
    doc
      .font("Helvetica")
      .text(
        ` ${
          entrega.nota?.dataEmissao
            ? new Date(entrega.nota.dataEmissao).toLocaleString()
            : "-"
        }`
      );
    doc.moveDown();

    // Mapa estático (se disponível)
    if (
      mapaBuffer &&
      typeof entrega.latitude === "number" &&
      typeof entrega.longitude === "number"
    ) {
      try {
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Mapa da Localização:", { underline: true });
        doc.image(mapaBuffer, {
          fit: [520, 140],
          align: "center",
        });
        // Link clicável para abrir no Google Maps
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${entrega.latitude},${entrega.longitude}`;
        doc.moveDown(0.2);
        doc
          .fillColor("blue")
          .fontSize(11)
          .text("Abrir localização no Google Maps", {
            link: mapsUrl,
            underline: true,
            align: "center",
          });
        doc.fillColor("black");
      } catch (imageError) {
        console.error("Erro ao adicionar imagem do mapa ao PDF:", imageError);
        doc.text("[Erro ao processar imagem do mapa]");
      }
      doc.moveDown();
    }

    // Comprovante (imagem)
    if (entrega.comprovante) {
      const filePath = join(
        __dirname,
        "../../uploads/entregas",
        entrega.comprovante
      );
      if (existsSync(filePath)) {
        doc.fontSize(14).text("Comprovante da Entrega:");
        doc.image(filePath, {
          fit: [400, 400],
          align: "center",
          valign: "center",
        });
        doc.moveDown();
      } else {
        doc.text("[Arquivo de comprovante não encontrado]");
      }
    } else {
      doc.text("[Sem comprovante anexado]");
    }

    // Buscar histórico de motoristas (redespacho)
    const motoristasHistorico = await prisma.entregaMotorista.findMany({
      where: { entregaId: entrega.id },
      include: { motorista: { select: { nome: true } } },
      orderBy: { ordem: "asc" },
    });
    if (motoristasHistorico.length > 0) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Histórico de Motoristas", { underline: true });
      doc.moveDown(0.2);
      motoristasHistorico.forEach((m, idx) => {
        let status = "";
        if (
          entrega.status === "Entregue" &&
          idx === motoristasHistorico.length - 1
        ) {
          status = "(Finalizou)";
        } else if (m.dataTransferencia) {
          status = "(Transferiu)";
        } else if (
          idx === motoristasHistorico.length - 1 &&
          entrega.status !== "Entregue"
        ) {
          status = "(Em posse)";
        }
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(
            `${m.ordem}º - ${m.motorista.nome} ${status} ${
              m.dataTransferencia
                ? `- Transferiu em: ${new Date(
                    m.dataTransferencia
                  ).toLocaleString()}`
                : ""
            }`
          );
      });
      doc.moveDown();
    }

    doc.end();
    return reply.send(doc);
  }

  /**
   * Transferir entrega de redespacho para o próximo motorista
   * @route PUT /entregas/:id/transferir-redespacho
   * @param id path number - ID da entrega
   * @body { latitude?: number, longitude?: number }
   * @access Motorista autenticado (precisa ser o atual da ordem)
   * @returns 200 { success: boolean, proximoMotorista: { id, nome, ordem } }
   */
  async transferirRedespacho(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const reqUser = (request as any).user;
    const { latitude, longitude } = request.body as any;
    // Busca entrega e motoristas do redespacho
    const entrega = await prisma.entrega.findUnique({
      where: { id: Number(id) },
      include: { motoristas: { include: { motorista: true } } },
    });
    if (!entrega || !entrega.redespacho) {
      return reply
        .status(400)
        .send({ error: "Entrega não é redespacho ou não encontrada." });
    }
    // Descobre ordem do motorista atual
    const vincAtual = entrega.motoristas.find(
      (v) => v.motoristaId === reqUser.userId
    );
    if (!vincAtual) {
      return reply
        .status(403)
        .send({ error: "Você não está vinculado a esta entrega." });
    }
    // Só pode transferir se for o motorista com menor ordem sem dataTransferencia
    const ordemAtual = vincAtual.ordem;
    const isAtual =
      !vincAtual.dataTransferencia &&
      ordemAtual ===
        Math.min(
          ...entrega.motoristas
            .filter((v) => !v.dataTransferencia)
            .map((v) => v.ordem)
        );
    if (!isAtual) {
      return reply.status(403).send({
        error: "Você não é o motorista atual para transferir a entrega.",
      });
    }
    // Atualiza dataTransferencia do motorista atual
    await prisma.entregaMotorista.update({
      where: {
        entregaId_motoristaId: {
          entregaId: entrega.id,
          motoristaId: reqUser.userId,
        },
      },
      data: { dataTransferencia: new Date() },
    });
    // Atualiza localização da entrega (opcional)
    await prisma.entrega.update({
      where: { id: entrega.id },
      data: {
        latitude: latitude !== undefined ? latitude : entrega.latitude,
        longitude: longitude !== undefined ? longitude : entrega.longitude,
      },
    });
    // Descobre próximo motorista
    const proximo = entrega.motoristas.find((v) => v.ordem === ordemAtual + 1);
    let proximoMotorista = null;
    if (proximo) {
      proximoMotorista = {
        id: proximo.motorista.id,
        nome: proximo.motorista.nome,
        ordem: proximo.ordem,
      };
    }
    await logAction(
      reqUser.userId,
      "TRANSFER_REDESPACHO",
      "Entrega",
      entrega.id,
      `Transferência para motorista ordem ${ordemAtual + 1}`
    );
    return reply.send({ success: true, proximoMotorista });
  }

  async updateRedespacho(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { redespacho } = request.body as any;
    if (typeof redespacho !== "boolean") {
      return reply
        .status(400)
        .send({ error: "Campo redespacho obrigatório (boolean)" });
    }
    const entrega = await prisma.entrega.update({
      where: { id: Number(id) },
      data: { redespacho },
    });
    return reply.send(entrega);
  }
}
