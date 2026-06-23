import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { join } from "path";
import { notaRoutes } from "./routes/nota";
import { entregaRoutes } from "./routes/entrega";
import { ocorrenciaRoutes } from "./routes/ocorrencia";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { auditLogRoutes } from "./routes/auditLog";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

const app = Fastify({
  ajv: {
    customOptions: {
      removeAdditional: false,
      strict: false,
    },
  },
});

app.register(cors, {
  origin: (origin, cb) => {
    const allowed = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    // Permitir requests sem origin (ex: mobile, Insomnia, curl)
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);

    cb(new Error(`CORS: origin '${origin}' não permitida`), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Servir arquivos de notas
app.register(fastifyStatic, {
  root: join(__dirname, "../uploads/notas"),
  prefix: "/arquivos/notas/",
  decorateReply: false,
  setHeaders: (res, path, stat) => {
    res.setHeader("Content-Disposition", "attachment");
  },
});
// Servir arquivos de comprovantes de entrega
app.register(fastifyStatic, {
  root: join(__dirname, "../uploads/entregas"),
  prefix: "/arquivos/entregas/",
  decorateReply: false,
});
// Servir arquivos de ocorrências
app.register(fastifyStatic, {
  root: join(__dirname, "../uploads/ocorrencias"),
  prefix: "/arquivos/ocorrencias/",
  decorateReply: false,
});

app.register(swagger, {
  openapi: {
    info: {
      title: "Controle de Entrega API",
      description: "Documentação da API de controle de entrega/logística",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
});

app.register(swaggerUI, {
  routePrefix: "/docs",
});

app.register(notaRoutes, { prefix: "/notas" });
app.register(entregaRoutes, { prefix: "/entregas" });
app.register(ocorrenciaRoutes, { prefix: "/ocorrencias" });
app.register(authRoutes, { prefix: "/auth" });
app.register(userRoutes, { prefix: "/users" });
app.register(auditLogRoutes, { prefix: "/audit-logs" });

// Adiciona log global de requisições para depuração
app.addHook("onRequest", (request, reply, done) => {
  done();
});

app.get(
  "/ping",
  {
    schema: {
      description: "Ping test",
      tags: ["Test"],
      response: {
        200: {
          type: "object",
          properties: {
            pong: { type: "string" },
          },
        },
      },
    },
  },
  async (req, reply) => {
    return { pong: "it works!" };
  }
);

app.listen({ port: 3333, host: "0.0.0.0" }).then(() => {
  console.log("🚚 Servidor rodando em http://localhost:3333");
});
