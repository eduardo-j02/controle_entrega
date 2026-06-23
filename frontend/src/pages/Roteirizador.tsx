import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type EntregaInput = {
  endereco: string;
};

type PontoParada = {
  id: number;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  ordem: number;
  tipo: "ORIGEM" | "ENTREGA" | "DESTINO";
};

type RotaResult = {
  rota: {
    id: number;
    numero: string;
    origem: string | null;
    destino: string | null;
    distanciaKm: number | null;
    tempoEstimadoMinutos: number | null;
    custoPedagio: number | null;
    pontosParada: PontoParada[];
  };
  pedagios: Array<{
    id: number;
    nome: string;
    rodovia: string;
    valorCarro: number;
    distanciaKm: number;
  }>;
  geometry: [number, number][];
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const Roteirizador: React.FC = () => {
  const { token, forceLogout, pingToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [numero, setNumero] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [entregas, setEntregas] = useState<EntregaInput[]>([{ endereco: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RotaResult | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-23.5505, -46.6333], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !result) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    markersRef.current?.clearLayers();

    const latLngs = result.geometry.map(([lon, lat]) => [lat, lon] as [number, number]);
    if (latLngs.length) {
      routeLayerRef.current = L.polyline(latLngs, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.9,
      }).addTo(mapRef.current);
    }

    result.rota.pontosParada.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      const marker = L.marker([p.latitude, p.longitude])
        .bindPopup(`<b>${p.ordem}. ${p.tipo}</b><br/>${p.endereco}`);
      marker.addTo(markersRef.current!);
    });

    const groupBounds = L.featureGroup([
      ...(routeLayerRef.current ? [routeLayerRef.current] : []),
      ...(markersRef.current ? [markersRef.current] : []),
    ]).getBounds();

    if (groupBounds.isValid()) {
      mapRef.current.fitBounds(groupBounds.pad(0.15));
    }
  }, [result]);

  const entregasValidas = useMemo(
    () => entregas.map((e) => e.endereco.trim()).filter(Boolean),
    [entregas]
  );

  const addEntrega = () => setEntregas((prev) => [...prev, { endereco: "" }]);

  const removeEntrega = (idx: number) => {
    setEntregas((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const updateEntrega = (idx: number, value: string) => {
    setEntregas((prev) => prev.map((item, i) => (i === idx ? { endereco: value } : item)));
  };

  const otimizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!numero.trim() || !origem.trim()) {
      setError("Informe o número da rota e o endereço de origem.");
      return;
    }

    if (!entregasValidas.length) {
      setError("Informe ao menos um endereço de entrega.");
      return;
    }

    setLoading(true);
    try {
      if (typeof pingToken === "function") {
        const ok = await pingToken();
        if (!ok) {
          forceLogout();
          return;
        }
      }

      const response = await fetch(`${API_URL}/rotas/otimizar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numero: numero.trim(),
          origem: origem.trim(),
          destino: destino.trim() || undefined,
          entregas: entregasValidas.map((endereco) => ({ endereco })),
        }),
      });

      if (response.status === 401) {
        forceLogout();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Não foi possível otimizar a rota.");
        return;
      }

      setResult(data as RotaResult);
    } catch {
      setError("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ width: "100%", maxWidth: 1200, padding: 24 }}>
        <h1 style={{ color: "#1d4ed8", marginBottom: 16 }}>Roteirizador</h1>

        <form
          onSubmit={otimizar}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #dbeafe",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número da rota"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <input
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            placeholder="Origem"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <input
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            placeholder="Destino (opcional)"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Entregas</strong>
            {entregas.map((entrega, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  value={entrega.endereco}
                  onChange={(e) => updateEntrega(idx, e.target.value)}
                  placeholder={`Endereço de entrega ${idx + 1}`}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
                <button
                  type="button"
                  onClick={() => removeEntrega(idx)}
                  style={{ padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addEntrega}
              style={{ marginTop: 10, border: "none", background: "#2563eb", color: "#fff", padding: "8px 12px", borderRadius: 8 }}
            >
              + Adicionar entrega
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              gridColumn: "1 / -1",
              background: loading ? "#94a3b8" : "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "Otimizando..." : "Otimizar rota"}
          </button>
        </form>

        {error && (
          <div style={{ marginBottom: 12, color: "#dc2626", fontWeight: 600 }}>{error}</div>
        )}

        {result && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #dbeafe",
              padding: 16,
              marginBottom: 16,
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div><strong>Distância:</strong> {result.rota.distanciaKm ?? 0} km</div>
            <div><strong>Tempo:</strong> {result.rota.tempoEstimadoMinutos ?? 0} min</div>
            <div><strong>Pedágio:</strong> R$ {(result.rota.custoPedagio ?? 0).toFixed(2)}</div>
            <div><strong>Paradas:</strong> {result.rota.pontosParada.length}</div>
          </div>
        )}

        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: 480,
            borderRadius: 12,
            border: "1px solid #dbeafe",
            overflow: "hidden",
            background: "#e2e8f0",
          }}
        />
      </div>
    </Layout>
  );
};

export default Roteirizador;
