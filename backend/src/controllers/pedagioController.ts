import { FastifyReply, FastifyRequest } from "fastify";
import { PedagioService } from "../services/pedagioService";

export class PedagioController {
  private readonly service = new PedagioService();

  async importar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as {
        pedagios: Array<{
          nome: string;
          rodovia: string;
          km?: number;
          latitude: number;
          longitude: number;
          valorCarro?: number;
        }>;
      };
      const result = await this.service.importarPedagios(body.pedagios || []);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error?.message || "Falha ao importar pedágios." });
    }
  }

  async proximas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { latitude, longitude, raioKm } = request.query as {
        latitude: string;
        longitude: string;
        raioKm?: string;
      };

      const result = await this.service.buscarPedagiosProximos(
        Number(latitude),
        Number(longitude),
        raioKm ? Number(raioKm) : 20
      );

      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error?.message || "Falha ao buscar pedágios." });
    }
  }
}
