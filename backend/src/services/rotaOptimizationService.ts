import { TipoPontoParada } from "@prisma/client";
import prisma from "../lib/prisma";
import { GeocodingServiceFactory } from "./geocodingService";
import { OsrmService } from "./osrmService";
import { PedagioService } from "./pedagioService";

interface PontoEntrada {
  endereco: string;
  notaId?: number;
}

interface OtimizarRotaInput {
  numero: string;
  origem: string;
  destino?: string;
  entregas?: PontoEntrada[];
  notaIds?: number[];
}

export class RotaOptimizationService {
  private readonly geocodingService = GeocodingServiceFactory.create();
  private readonly osrmService = new OsrmService();
  private readonly pedagioService = new PedagioService();

  async otimizar(input: OtimizarRotaInput) {
    const numero = input.numero?.trim();
    const origem = input.origem?.trim();
    const destino = input.destino?.trim() || undefined;

    if (!numero || !origem) {
      throw new Error("Número da rota e origem são obrigatórios.");
    }

    const entregasPorEndereco = (input.entregas || [])
      .map((e) => ({ endereco: e.endereco?.trim(), notaId: e.notaId }))
      .filter((e) => !!e.endereco) as PontoEntrada[];

    const entregasPorNota: PontoEntrada[] = [];
    if (input.notaIds?.length) {
      const notas = await prisma.nota.findMany({
        where: { id: { in: input.notaIds } },
        select: { id: true, destinatario: true },
      });
      for (const nota of notas) {
        if (nota.destinatario?.trim()) {
          entregasPorNota.push({ endereco: nota.destinatario.trim(), notaId: nota.id });
        }
      }
    }

    const entregas = [...entregasPorEndereco, ...entregasPorNota];
    if (!entregas.length) {
      throw new Error("Informe ao menos um endereço de entrega ou uma nota para otimização.");
    }

    const pontosEntrada: PontoEntrada[] = [{ endereco: origem }, ...entregas];
    if (destino) {
      pontosEntrada.push({ endereco: destino });
    }

    const geocodificados = [] as Array<
      PontoEntrada & { latitude: number; longitude: number; formattedAddress: string }
    >;

    for (const ponto of pontosEntrada) {
      const resolved = await this.geocodingService.getCoordinatesFromAddress(ponto.endereco);
      if (!resolved) {
        throw new Error(`Não foi possível geocodificar o endereço: ${ponto.endereco}`);
      }
      geocodificados.push({
        ...ponto,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        formattedAddress: resolved.formattedAddress,
      });
    }

    const osrmResult = await this.osrmService.optimizeTrip(
      geocodificados.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))
    );

    const ordered = osrmResult.waypointOrder.map((idx) => geocodificados[idx]).filter(Boolean);

    const { custoTotal, pedagios } = await this.pedagioService.calcularPedagiosNaRota(
      osrmResult.geometry
    );

    const rota = await prisma.$transaction(async (tx) => {
      const existing = await tx.rota.findUnique({ where: { numero } });
      const data = {
        origem,
        destino: destino || ordered[ordered.length - 1]?.formattedAddress || null,
        distanciaKm: Number((osrmResult.distanceMeters / 1000).toFixed(2)),
        tempoEstimadoMinutos: Math.round(osrmResult.durationSeconds / 60),
        custoPedagio: custoTotal,
        dataOtimizacao: new Date(),
      };

      const rotaEntity = existing
        ? await tx.rota.update({ where: { id: existing.id }, data })
        : await tx.rota.create({ data: { numero, ...data } });

      await tx.pontoParada.deleteMany({ where: { rotaId: rotaEntity.id } });

      const pontosToCreate = ordered.map((p, index) => {
        const isFirst = index === 0;
        const isLast = index === ordered.length - 1;

        let tipo: TipoPontoParada = TipoPontoParada.ENTREGA;
        if (isFirst) tipo = TipoPontoParada.ORIGEM;
        if (isLast && destino) tipo = TipoPontoParada.DESTINO;

        return {
          rotaId: rotaEntity.id,
          endereco: p.formattedAddress,
          latitude: p.latitude,
          longitude: p.longitude,
          ordem: index + 1,
          tipo,
          notaId: p.notaId,
        };
      });

      if (pontosToCreate.length) {
        await tx.pontoParada.createMany({ data: pontosToCreate });
      }

      return tx.rota.findUnique({
        where: { id: rotaEntity.id },
        include: {
          pontosParada: { orderBy: { ordem: "asc" } },
        },
      });
    });

    return {
      rota,
      pedagios,
      geometry: osrmResult.geometry,
    };
  }

  async listarOtimizadas() {
    return prisma.rota.findMany({
      where: { dataOtimizacao: { not: null } },
      orderBy: { dataOtimizacao: "desc" },
      include: {
        pontosParada: { orderBy: { ordem: "asc" } },
      },
    });
  }

  async detalhes(id: number) {
    return prisma.rota.findUnique({
      where: { id },
      include: {
        pontosParada: { orderBy: { ordem: "asc" } },
        notas: true,
      },
    });
  }
}
