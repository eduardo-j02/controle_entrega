// eslint-disable-next-line @typescript-eslint/no-require-imports
const StaticMaps = require("staticmaps");

// Interface para serviços de mapa estático
export interface StaticMapService {
  getMapBuffer(
    latitude: number,
    longitude: number,
    width?: number,
    height?: number,
    zoom?: number
  ): Promise<Buffer>;
}

// Implementação usando OpenStreetMap via pacote 'staticmaps' (sem API key)
export class OsmStaticMapService implements StaticMapService {
  async getMapBuffer(
    latitude: number,
    longitude: number,
    width: number = 600,
    height: number = 400,
    zoom: number = 15
  ): Promise<Buffer> {
    const map = new StaticMaps({ width, height });
    // Círculo vermelho para marcar a posição
    map.addCircle({
      coord: [longitude, latitude],
      radius: 50,
      fill: true,
      color: "#cc0000",
      width: 3,
      fillColor: "#cc000080",
    });
    await map.render([longitude, latitude], zoom);
    return map.image.buffer("image/png", { compressionLevel: 9 });
  }
}

// Factory para criar o serviço de mapa estático
export class StaticMapServiceFactory {
  static create(): StaticMapService {
    return new OsmStaticMapService();
  }
}
