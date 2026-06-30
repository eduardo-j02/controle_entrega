import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type AddressSuggestion = {
  place_id: number;
  display_name: string;
};

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

const createStopIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:999px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
  });

const AUTOCOMPLETE_URL =
  import.meta.env.VITE_NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";

type AddressAutocompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  style?: React.CSSProperties;
};

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder,
  style,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const url = `${AUTOCOMPLETE_URL}?format=jsonv2&countrycodes=br&addressdetails=1&limit=6&q=${encodeURIComponent(
          query
        )}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "pt-BR",
          },
        });
        if (!response.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }

        const data = (await response.json()) as AddressSuggestion[];
        setSuggestions(data || []);
        setOpen((data || []).length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [value]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: "100%", ...style }}
      />

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
          }}
        >
          {loadingSuggestions ? (
            <div style={{ padding: 10, fontSize: 13, color: "#64748b" }}>
              Buscando enderecos...
            </div>
          ) : (
            suggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(item.display_name);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: 13,
                }}
              >
                {item.display_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

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

    let entregaNumero = 0;
    result.rota.pontosParada.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;

      let label = "?";
      let color = "#1d4ed8";
      if (p.tipo === "ORIGEM") {
        label = "O";
        color = "#0f766e";
      } else if (p.tipo === "DESTINO") {
        label = "D";
        color = "#7c3aed";
      } else {
        entregaNumero += 1;
        label = String(entregaNumero);
        color = "#2563eb";
      }

      const marker = L.marker([p.latitude, p.longitude], {
        icon: createStopIcon(label, color),
      }).bindPopup(`<b>${p.ordem}. ${p.tipo}</b><br/>${p.endereco}`);
      marker.addTo(markersRef.current!);
    });

    const markerLayers = (markersRef.current?.getLayers() ?? []) as L.Layer[];
    const groupBounds = L.featureGroup([
      ...(routeLayerRef.current ? [routeLayerRef.current] : []),
      ...markerLayers,
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
      <div style={{ width: "100%", maxWidth: 1600, padding: 24, margin: "0 auto" }}>
        <h1 style={{ color: "#1d4ed8", marginBottom: 28, fontSize: 28 }}>Roteirizador</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            alignItems: "start",
          }}
        >
          {/* Coluna esquerda: Formulário e Resultados */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Card Formulário */}
            <form
              onSubmit={otimizar}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e0e7ff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: 0 }}>Planar Rota</h2>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Número da rota"
                style={{ padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />

              <AddressAutocompleteInput
                value={origem}
                onChange={setOrigem}
                placeholder="Origem"
                style={{ padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />

              <AddressAutocompleteInput
                value={destino}
                onChange={setDestino}
                placeholder="Destino (opcional)"
                style={{ padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                <strong style={{ display: "block", marginBottom: 10, color: "#1e293b", fontSize: 14 }}>Endereços de Entrega</strong>
                {entregas.map((entrega, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <AddressAutocompleteInput
                      value={entrega.endereco}
                      onChange={(value) => updateEntrega(idx, value)}
                      placeholder={`Endereco de entrega ${idx + 1}`}
                      style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeEntrega(idx)}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEntrega}
                  style={{ marginTop: 8, border: "none", background: "#2563eb", color: "#fff", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                >
                  + Adicionar entrega
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "#94a3b8" : "#1d4ed8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                {loading ? "Otimizando..." : "Otimizar rota"}
              </button>
            </form>

            {/* Card Erro */}
            {error && (
              <div style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                padding: 14,
                color: "#991b1b",
                fontSize: 14,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Card Resultados */}
            {result && (
              <div style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 12,
                padding: 20,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: 0, marginBottom: 14 }}>Resumo da Rota</h2>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  marginBottom: result.pedagios.length ? 18 : 0,
                }}>
                  <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Distância</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>{result.rota.distanciaKm ?? 0} km</div>
                  </div>
                  <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Tempo</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>{result.rota.tempoEstimadoMinutos ?? 0} min</div>
                  </div>
                  <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Pedágio</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#059669" }}>R$ {(result.rota.custoPedagio ?? 0).toFixed(2)}</div>
                  </div>
                  <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Paradas</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>{result.rota.pontosParada.length}</div>
                  </div>
                </div>

                {result.pedagios.length > 0 && (
                  <div style={{ borderTop: "1px solid #bae6fd", paddingTop: 14 }}>
                    <strong style={{ display: "block", marginBottom: 10, fontSize: 14, color: "#1e293b" }}>
                      Praças de Pedágio ({result.pedagios.length})
                    </strong>
                    <div style={{ display: "grid", gap: 8 }}>
                      {result.pedagios.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            background: "#fff",
                            padding: "12px 14px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            fontSize: 13,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                            <strong style={{ color: "#1e293b" }}>{p.nome}</strong>
                            <span style={{ color: "#059669", fontWeight: 600 }}>R$ {p.valorCarro.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {p.rodovia} · {p.distanciaKm.toFixed(2)} km da rota
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna direita: Mapa */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e7ff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "sticky",
            top: 24,
            height: "fit-content",
          }}>
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: 650,
                background: "#e2e8f0",
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Roteirizador;
