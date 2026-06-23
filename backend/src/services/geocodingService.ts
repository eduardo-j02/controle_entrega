// Interface para serviços de geocodificação reversa
export interface GeocodingService {
  getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null>;
}

// Implementação usando Nominatim (OpenStreetMap) - GRATUITO
export class NominatimGeocodingService implements GeocodingService {
  private baseUrl = "https://nominatim.openstreetmap.org";

  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "PolarEntregas/1.0", // Nominatim requer User-Agent
        },
      });

      if (!response.ok) {
        console.error("Erro na geocodificação reversa:", response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.display_name) {
        return data.display_name;
      }

      return null;
    } catch (error) {
      console.error("Erro ao obter endereço:", error);
      return null;
    }
  }
}

// Implementação usando Google Geocoding API (para uso futuro)
export class GoogleGeocodingService implements GeocodingService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error("Erro ao obter endereço via Google:", error);
      return null;
    }
  }
}

// Factory para criar o serviço de geocodificação
export class GeocodingServiceFactory {
  static create(): GeocodingService {
    // Para trocar o serviço no futuro, basta alterar esta linha:
    // return new GoogleGeocodingService(process.env.GOOGLE_API_KEY!);
    return new NominatimGeocodingService();
  }
}
