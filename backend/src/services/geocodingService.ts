export interface GeocodingCoordinates {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

// Interface para serviços de geocodificação
export interface GeocodingService {
  getCoordinatesFromAddress(
    address: string
  ): Promise<GeocodingCoordinates | null>;

  getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null>;
}

// Implementação usando Nominatim (OpenStreetMap) - GRATUITO
export class NominatimGeocodingService implements GeocodingService {
  private baseUrl = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
  private userAgent = process.env.GEOCODING_USER_AGENT || "PolarEntregas/1.0";

  async getCoordinatesFromAddress(
    address: string
  ): Promise<GeocodingCoordinates | null> {
    try {
      const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        console.error("Erro na geocodificação:", response.statusText);
        return null;
      }

      const data = await response.json();
      const first = Array.isArray(data) ? data[0] : null;

      if (!first || !first.lat || !first.lon) {
        return null;
      }

      return {
        latitude: Number(first.lat),
        longitude: Number(first.lon),
        formattedAddress: String(first.display_name || address),
      };
    } catch (error) {
      console.error("Erro ao obter coordenadas:", error);
      return null;
    }
  }

  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent, // Nominatim requer User-Agent
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

  async getCoordinatesFromAddress(
    address: string
  ): Promise<GeocodingCoordinates | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry?.location;
        if (!location) return null;
        return {
          latitude: Number(location.lat),
          longitude: Number(location.lng),
          formattedAddress: String(data.results[0].formatted_address || address),
        };
      }

      return null;
    } catch (error) {
      console.error("Erro ao obter coordenadas via Google:", error);
      return null;
    }
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
