import { FastifyRequest, FastifyReply } from "fastify";
import { join } from "path";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import { toZonedTime, format } from "date-fns-tz";
import { logAction } from "../services/auditLogService";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import PDFDocument from "pdfkit";
import { gerarPDF } from "nfe-pdf";
import prisma from "../lib/prisma";
const timeZone = "America/Sao_Paulo";

function getField(fields: any, name: string): string {
  const field = fields[name];
  if (!field) return "";
  if (Array.isArray(field)) {
    return String(field[0]?.value ?? field[0] ?? "");
  }
  return String(field.value ?? field ?? "");
}

export class NotaController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data)
      return reply.status(400).send({ error: "Arquivo da nota é obrigatório" });

    const { fields, file, filename } = data;
    const numero = String(getField(fields, "numero") ?? "");
    const emissor = String(getField(fields, "emissor") ?? "");
    const destinatario = String(getField(fields, "destinatario") ?? "");
    const dataEmissao = new Date(getField(fields, "dataEmissao") ?? "");
    if (!numero || !emissor || !destinatario || !dataEmissao) {
      return reply.status(400).send({ error: "Campos obrigatórios faltando" });
    }
    const safeFilename = `${randomUUID()}_${filename}`;
    const dirPath = join(__dirname, "../../uploads/notas");
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    const uploadPath = join(dirPath, safeFilename);

    // Validação de tipo e tamanho
    const allowedTypes = ["application/pdf", "application/xml", "text/xml"];
    const allowedExts = [".pdf", ".xml"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(data.mimetype) || !allowedExts.includes(ext)) {
      return reply
        .status(400)
        .send({ error: "Tipo de arquivo não permitido. Envie PDF ou XML." });
    }
    let fileSize = 0;
    file.on("data", (chunk) => {
      fileSize += chunk.length;
    });
    await new Promise((resolve, reject) => {
      file
        .pipe(createWriteStream(uploadPath))
        .on("finish", () => {
          if (fileSize > maxSize) {
            return reject(new Error("Arquivo excede o tamanho máximo de 5MB."));
          }
          resolve(null);
        })
        .on("error", reject);
    }).catch((err) => {
      return reply.status(400).send({ error: err.message });
    });
    const nota = await prisma.nota.create({
      data: {
        numero,
        emissor,
        destinatario,
        dataEmissao,
        arquivo: safeFilename,
      },
    });
    const reqUser = (request as any).user;
    await logAction(
      reqUser?.userId || null,
      "CREATE",
      "Nota",
      nota.id,
      `Nota criada: ${numero}`
    );
    const notaBr = {
      ...nota,
      dataEmissao: format(
        toZonedTime(nota.dataEmissao, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      createdAt: format(
        toZonedTime(nota.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
    };
    return reply.send(notaBr);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const notas = await prisma.nota.findMany({
      select: {
        id: true,
        numero: true,
        destinatario: true,
        dataEmissao: true,
        arquivo: true,
        createdAt: true,
        rotaId: true,
        rota: { select: { numero: true } },
        chaveXml: true,
      },
    });
    const notasBr = notas.map((nota) => ({
      ...nota,
      chaveXml: nota.chaveXml ?? null,
      rotaNumero: nota.rota?.numero ?? null,
      dataEmissao: format(
        toZonedTime(nota.dataEmissao, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      createdAt: format(
        toZonedTime(nota.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
    }));
    return reply.send(notasBr);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const nota = await prisma.nota.findUnique({ where: { id: Number(id) } });
    if (!nota) return reply.status(404).send({ error: "Nota não encontrada" });
    const notaBr = {
      ...nota,
      dataEmissao: format(
        toZonedTime(nota.dataEmissao, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
      createdAt: format(
        toZonedTime(nota.createdAt, timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      ),
    };
    return reply.send(notaBr);
  }

  async createByRota(request: FastifyRequest, reply: FastifyReply) {
    const parts = request.parts();
    let rotaNumero = "";
    const arquivos: { buffer: Buffer; filename: string; mimetype: string }[] =
      [];
    for await (const part of parts) {
      if (part.type === "field" && part.fieldname === "rotaNumero") {
        rotaNumero =
          typeof part.value === "string"
            ? part.value
            : String(part.value ?? "");
      } else if (part.type === "file" && part.fieldname === "xmls") {
        // Consumir o stream imediatamente em buffer para não bloquear o parser multipart
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk as Buffer);
        }
        arquivos.push({
          buffer: Buffer.concat(chunks),
          filename: typeof part.filename === "string" ? part.filename : "arquivo.xml",
          mimetype: part.mimetype,
        });
      }
    }
    if (!rotaNumero || arquivos.length === 0) {
      return reply
        .status(400)
        .send({ error: "Número da rota e arquivos XML são obrigatórios." });
    }
    // Cria ou busca rota
    let rota = await prisma.rota.findUnique({ where: { numero: rotaNumero } });
    if (!rota) {
      rota = await prisma.rota.create({ data: { numero: rotaNumero } });
    }
    const notasCriadas = [];
    const notasDuplicadas: string[] = [];
    for (const arquivo of arquivos) {
      // Validação de tipo e extensão para todos os arquivos
      const allowedTypes = ["application/xml", "text/xml"];
      const allowedExts = [".xml"];
      const originalFilename = arquivo.filename;
      const ext = originalFilename
        .slice(originalFilename.lastIndexOf("."))
        .toLowerCase();
      if (
        !allowedTypes.includes(arquivo.mimetype) ||
        !allowedExts.includes(ext)
      ) {
        continue;
      }
      // Parse XML para extrair chave antes de salvar
      let chaveXml: string = "";
      let filename = "";
      let safeFilename: string = "";
      let numero: string = "";
      let dataEmissao: string = "";
      let cliente: string = "";
      // Usar buffer diretamente — sem criar arquivo temporário
      const xmlContent = arquivo.buffer.toString("utf-8");
      let parsed: any;
      try {
        parsed = await parseStringPromise(xmlContent);
        // Buscar chave NFe de forma robusta
        if ((parsed as any).nfeProc?.NFe?.[0]?.$?.Id) {
          // Exemplo: <NFe Id="NFe123...">
          const idAttr = (parsed as any).nfeProc.NFe[0].$?.Id;
          const match = idAttr.match(/NFe(\d{44})/);
          if (match) chaveXml = match[1];
        } else if ((parsed as any).nfeProc?.NFe?.[0]?.infNFe?.[0]?.$?.Id) {
          // Exemplo: <infNFe Id="NFe123...">
          const idAttr = (parsed as any).nfeProc.NFe[0].infNFe[0].$?.Id;
          const match = idAttr.match(/NFe(\d{44})/);
          if (match) chaveXml = match[1];
        }
        if (!chaveXml) {
          const rawChaveXml = (parsed as any).nfeProc?.protNFe?.[0]
            ?.infProt?.[0]?.chNFe?.[0];
          chaveXml =
            typeof rawChaveXml === "string"
              ? rawChaveXml
              : String(rawChaveXml ?? "");
        }
        // Extrair dados do XML
        const rawNumero = (parsed as any).nfeProc?.NFe?.[0]?.infNFe?.[0]
          ?.ide?.[0]?.nNF?.[0];
        numero =
          typeof rawNumero === "string" ? rawNumero : String(rawNumero ?? "");
        const rawDataEmissao = (parsed as any).nfeProc?.NFe?.[0]?.infNFe?.[0]
          ?.ide?.[0]?.dhEmi?.[0];
        dataEmissao =
          typeof rawDataEmissao === "string"
            ? rawDataEmissao
            : String(rawDataEmissao ?? "");
        const rawCliente = (parsed as any).nfeProc?.NFe?.[0]?.infNFe?.[0]
          ?.dest?.[0]?.xNome?.[0];
        cliente =
          typeof rawCliente === "string"
            ? rawCliente
            : String(rawCliente ?? "");
      } catch (e) {
        console.error("[Nota] Erro ao processar XML:", e);
        continue;
      }
      // Define o nome do arquivo pela chave
      filename = chaveXml
        ? `${chaveXml}${ext}`
        : `${randomUUID()}_${originalFilename}`;
      safeFilename = filename;
      const dirPath = join(__dirname, "../../uploads/notas");
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
      const uploadPath = join(dirPath, filename);
      try {
        await fs.promises.writeFile(uploadPath, arquivo.buffer);
      } catch (err) {
        console.error("[Nota] Erro ao salvar arquivo:", err);
        continue;
      }
      // Antes de criar a nota, verifica duplicidade pela chaveXml
      if (chaveXml) {
        const notaExistente = await prisma.nota.findFirst({
          where: { chaveXml: String(chaveXml) },
        });
        if (notaExistente) {
          notasDuplicadas.push(String(chaveXml));

          continue;
        }
      }
      // Conversão segura de dataEmissao para Date
      let dataEmissaoDate: Date | undefined = undefined;
      if (dataEmissao) {
        const parsedDate = new Date(dataEmissao);
        if (!isNaN(parsedDate.getTime())) {
          dataEmissaoDate = parsedDate;
        }
      }
      // dataEmissao é campo obrigatório no schema — pular arquivo se não conseguir parsear
      if (!dataEmissaoDate) {
        console.error("[Nota] dataEmissao inválida ou ausente no XML, arquivo ignorado:", safeFilename);
        await fs.promises.unlink(uploadPath).catch(() => {});
        continue;
      }
      const notaData: any = {
        numero: String(numero),
        emissor: "",
        destinatario: String(cliente),
        dataEmissao: dataEmissaoDate,
        arquivo: safeFilename,
        rotaId: rota.id,
        chaveXml: String(chaveXml),
        cliente: String(cliente),
      };
      const nota = await prisma.nota.create({
        data: notaData,
      });
      notasCriadas.push(nota);
    }
    return reply.send({ rota, notas: notasCriadas, notasDuplicadas });
  }

  async listRotasComNotas(request: FastifyRequest, reply: FastifyReply) {
    const rotas = await prisma.rota.findMany({
      include: {
        notas: {
          select: {
            id: true,
            numero: true,
            destinatario: true,
            dataEmissao: true,
            arquivo: true,
            createdAt: true,
            chaveXml: true,
            cliente: true,
            redespacho: true, // Adicionado para o frontend receber o valor
            entregas: {
              orderBy: { dataEntrega: "desc" },
              take: 1, // pega a entrega mais recente
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
    // Adiciona o status da última entrega à nota (flatten)
    const result = rotas.map((rota) => ({
      ...rota,
      notas: rota.notas.map((nota) => ({
        ...nota,
        statusEntrega: nota.entregas[0]?.status || null,
        entregas: undefined, // remove campo auxiliar
      })),
    }));
    return reply.send(result);
  }

  async getByChaveXml(request: FastifyRequest, reply: FastifyReply) {
    const { chave } = request.params as any;
    const nota = await prisma.nota.findUnique({ where: { chaveXml: chave } });
    if (!nota) return reply.status(404).send({ error: "Nota não encontrada" });
    return reply.send(nota);
  }

  async downloadPdf(request: FastifyRequest, reply: FastifyReply) {
    // CORS dinâmico para origens permitidas
    const allowedOrigins = ["*"];
    const origin = request.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
    }
    const { id } = request.params as any;

    const nota = await prisma.nota.findUnique({ where: { id: Number(id) } });
    if (!nota) {
      if (origin && allowedOrigins.includes(origin)) {
        reply.header("Access-Control-Allow-Origin", origin);
        reply.header("Access-Control-Allow-Credentials", "true");
      }
      return reply.status(404).send({ error: "Nota não encontrada" });
    }

    const xmlPath = join(__dirname, "../../uploads/notas", nota.arquivo);

    if (!fs.existsSync(xmlPath)) {
      if (origin && allowedOrigins.includes(origin)) {
        reply.header("Access-Control-Allow-Origin", origin);
        reply.header("Access-Control-Allow-Credentials", "true");
      }
      return reply.status(404).send({ error: "Arquivo XML não encontrado" });
    }
    const xmlContent = await fs.promises.readFile(xmlPath, "utf-8");
    try {
      // Gera o DANFE em PDF usando nfe-pdf
      const pdfStream = await gerarPDF(xmlContent, {});
      // Converte o stream em buffer
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        pdfStream.on("data", (chunk) => chunks.push(chunk));
        pdfStream.on("end", () => resolve(Buffer.concat(chunks)));
        pdfStream.on("error", reject);
      });
      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `attachment; filename=nota_${nota.id}.pdf`
      );
      if (origin && allowedOrigins.includes(origin)) {
        reply.header("Access-Control-Allow-Origin", origin);
        reply.header("Access-Control-Allow-Credentials", "true");
      }
      return reply.send(buffer);
    } catch (e) {
      if (origin && allowedOrigins.includes(origin)) {
        reply.header("Access-Control-Allow-Origin", origin);
        reply.header("Access-Control-Allow-Credentials", "true");
      }
      console.error("[DANFE] Erro ao gerar PDF:", e);
      return reply.status(500).send({ error: "Erro ao gerar PDF" });
    }
  }

  async downloadArquivo(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;

    const nota = await prisma.nota.findUnique({ where: { id: Number(id) } });
    if (!nota) {
      return reply.status(404).send({ error: "Nota não encontrada" });
    }

    const filePath = join(__dirname, "../../uploads/notas", nota.arquivo);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: "Arquivo não encontrado" });
    }

    reply.header("Content-Disposition", `attachment; filename=${nota.arquivo}`);
    return reply.send(fs.createReadStream(filePath));
  }

  async updateRota(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { redespacho } = request.body as any;
    if (typeof redespacho !== "boolean") {
      return reply
        .status(400)
        .send({ error: "Campo redespacho obrigatório (boolean)" });
    }
    const rota = await prisma.rota.update({
      where: { id: Number(id) },
      data: { redespacho },
    });
    return reply.send(rota);
  }

  async updateRedespacho(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { redespacho } = request.body as any;
    if (typeof redespacho !== "boolean") {
      return reply
        .status(400)
        .send({ error: "Campo redespacho obrigatório (boolean)" });
    }
    const nota = await prisma.nota.update({
      where: { id: Number(id) },
      data: { redespacho },
    });
    // Sincronizar todas as entregas vinculadas
    await prisma.entrega.updateMany({
      where: { notaId: Number(id) },
      data: { redespacho },
    });
    return reply.send(nota);
  }
}
