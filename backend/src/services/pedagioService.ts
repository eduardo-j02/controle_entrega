import prisma from "../lib/prisma";

interface PedagioNaRota {
  id: number;
  nome: string;
  rodovia: string;
  valorCarro: number;
  distanciaKm: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class PedagioService {
  async calcularPedagiosNaRota(
    geometry: [number, number][],
    raioKm = 1.2
  ): Promise<{ custoTotal: number; pedagios: PedagioNaRota[] }> {
    const pracas = await prisma.pracaPedagio.findMany({
      where: { valorCarro: { not: null } },
    });

    if (!geometry.length || !pracas.length) {
      return { custoTotal: 0, pedagios: [] };
    }

    const pedagiosEncontrados: PedagioNaRota[] = [];
    for (const praca of pracas) {
      let menorDistancia = Number.POSITIVE_INFINITY;

      for (let i = 0; i < geometry.length; i += 8) {
        const [lon, lat] = geometry[i];
        const dist = haversineKm(lat, lon, praca.latitude, praca.longitude);
        if (dist < menorDistancia) {
          menorDistancia = dist;
        }
        if (menorDistancia <= raioKm) {
          break;
        }
      }

      if (menorDistancia <= raioKm) {
        pedagiosEncontrados.push({
          id: praca.id,
          nome: praca.nome,
          rodovia: praca.rodovia,
          valorCarro: Number(praca.valorCarro || 0),
          distanciaKm: Number(menorDistancia.toFixed(3)),
        });
      }
    }

    const custoTotal = pedagiosEncontrados.reduce((acc, item) => acc + item.valorCarro, 0);
    return { custoTotal: Number(custoTotal.toFixed(2)), pedagios: pedagiosEncontrados };
  }

  async importarPedagios(
    dados: Array<{
      nome: string;
      rodovia: string;
      km?: number;
      latitude: number;
      longitude: number;
      valorCarro?: number;
    }>
  ) {
    if (!Array.isArray(dados) || !dados.length) {
      throw new Error("Nenhum dado de pedágio informado para importação.");
    }

    const created = await prisma.$transaction(
      dados.map((item) =>
        prisma.pracaPedagio.create({
          data: {
            nome: item.nome,
            rodovia: item.rodovia,
            km: item.km,
            latitude: item.latitude,
            longitude: item.longitude,
            valorCarro: item.valorCarro,
          },
        })
      )
    );

    return { total: created.length };
  }

  async buscarPedagiosProximos(latitude: number, longitude: number, raioKm = 20) {
    const pracas = await prisma.pracaPedagio.findMany({
      where: {
        latitude: {
          gte: latitude - raioKm / 110.574,
          lte: latitude + raioKm / 110.574,
        },
        longitude: {
          gte: longitude - raioKm / (111.32 * Math.cos((latitude * Math.PI) / 180)),
          lte: longitude + raioKm / (111.32 * Math.cos((latitude * Math.PI) / 180)),
        },
      },
    });

    return pracas
      .map((p) => {
        const distanciaKm = haversineKm(latitude, longitude, p.latitude, p.longitude);
        return {
          id: p.id,
          nome: p.nome,
          rodovia: p.rodovia,
          valorCarro: p.valorCarro,
          distanciaKm: Number(distanciaKm.toFixed(3)),
        };
      })
      .filter((p) => p.distanciaKm <= raioKm)
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }
}
