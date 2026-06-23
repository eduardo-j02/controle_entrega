import { FastifyReply, FastifyRequest } from "fastify";
import { RotaOptimizationService } from "../services/rotaOptimizationService";

export class RotaController {
  private readonly service = new RotaOptimizationService();

  async otimizar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as {
        numero: string;
        origem: string;
        destino?: string;
        entregas?: Array<{ endereco: string; notaId?: number }>;
        notaIds?: number[];
      };

      const result = await this.service.otimizar(body);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error?.message || "Falha ao otimizar rota." });
    }
  }

  async listarOtimizadas(request: FastifyRequest, reply: FastifyReply) {
    const rotas = await this.service.listarOtimizadas();
    return reply.send(rotas);
  }

  async detalhes(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const rota = await this.service.detalhes(Number(id));
    if (!rota) {
      return reply.status(404).send({ error: "Rota não encontrada." });
    }
    return reply.send(rota);
  }
}
