export interface OsrmTripResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // [lon, lat]
  waypointOrder: number[];
}

export class OsrmService {
  private readonly baseUrl =
    process.env.OSRM_BASE_URL || "http://router.project-osrm.org/trip/v1/driving";

  async optimizeTrip(coordinates: Array<{ latitude: number; longitude: number }>): Promise<OsrmTripResult> {
    if (coordinates.length < 2) {
      throw new Error("São necessários ao menos 2 pontos para otimizar a rota.");
    }

    const coordsPath = coordinates
      .map((c) => `${c.longitude},${c.latitude}`)
      .join(";");

    const url = `${this.baseUrl}/${coordsPath}?roundtrip=false&source=first&destination=last&steps=false&overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao consultar OSRM: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data?.trips?.length || !data?.waypoints?.length) {
      throw new Error("OSRM retornou resposta inválida para otimização.");
    }

    const trip = data.trips[0];
    const waypoints = data.waypoints as Array<{ waypoint_index: number; trips_index: number }>;
    const waypointOrder = waypoints
      .sort((a, b) => a.waypoint_index - b.waypoint_index)
      .map((wp) => wp.trips_index);

    return {
      distanceMeters: Number(trip.distance || 0),
      durationSeconds: Number(trip.duration || 0),
      geometry: (trip.geometry?.coordinates || []) as [number, number][],
      waypointOrder,
    };
  }
}
