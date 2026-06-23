import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Nota {
  id: number;
  numero: string;
  destinatario: string;
  dataEmissao: string;
  arquivo: string;
  createdAt: string;
  chaveXml?: string;
  cliente?: string;
  statusEntrega?: string; // <-- novo campo opcional
}

interface Rota {
  id: number;
  numero: string;
  notas: Nota[];
  redespacho?: boolean;
}

const Rotas: React.FC = () => {
  const { token, forceLogout, pingToken } = useAuth();
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadRota, setUploadRota] = useState("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [redespacho, setRedespacho] = useState(false);
  const [pesquisaRota, setPesquisaRota] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("Pendente");

  // Adicione pingToken na montagem (valida sessão logo ao acessar a página)
  useEffect(() => {
    (async () => {
      if (typeof pingToken === "function") {
        const ok = await pingToken();
        if (!ok) {
          forceLogout();
        }
      }
    })();
    fetchRotas();
  }, []);

  const fetchRotas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notas/rotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao carregar rotas");
      const data = await response.json();
      setRotas(data);
    } catch (err) {
      setError("Erro ao carregar rotas");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNotasPorRota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadRota || !uploadFiles || uploadFiles.length === 0) {
      setError("Informe o número da rota e selecione pelo menos um XML");
      return;
    }
    setUploading(true);
    setError("");
    try {
      // 1. PING antes do envio!
      if (typeof pingToken === "function") {
        const stillValid = await pingToken();
        if (!stillValid) {
          setError("Sessão expirada. Faça login novamente.");
          setUploading(false);
          setShowUploadModal(false);
          forceLogout();
          return;
        }
      }
      const formData = new FormData();
      formData.append("rotaNumero", uploadRota);
      for (let i = 0; i < uploadFiles.length; i++) {
        formData.append("xmls", uploadFiles[i]);
      }
      const uploadController = new AbortController();
      const uploadTimeout = setTimeout(() => uploadController.abort(), 120_000); // 2 min
      let response: Response;
      try {
        response = await fetch(`${API_URL}/notas/rota`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          signal: uploadController.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === "AbortError") {
          setError("O envio demorou muito. Verifique sua conexão e tente novamente.");
        } else {
          setError("Erro de rede ao enviar notas.");
        }
        setUploading(false);
        return;
      } finally {
        clearTimeout(uploadTimeout);
      }
      // 2. Tratamento explícito de 401
      if (response.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
        setUploading(false);
        setShowUploadModal(false);
        forceLogout();
        return;
      }
      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || "Erro ao enviar notas");
        setUploading(false);
        return;
      }
      const data = await response.json();
      setShowUploadModal(false);
      setUploadRota("");
      setUploadFiles(null);
      // Atualiza o campo redespacho da rota após o upload
      if (data.rota && typeof redespacho === "boolean") {
        await atualizarRedespachoRota(data.rota.id, redespacho);
      }
      fetchRotas();
    } catch (err) {
      setError("Erro ao enviar notas.");
      setShowUploadModal(false);
    } finally {
      setUploading(false);
    }
  };

  // Função para atualizar o campo redespacho da rota
  const atualizarRedespachoRota = async (
    rotaId: number,
    redespacho: boolean
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/notas/rotas/${rotaId}/redespacho`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ redespacho }),
        }
      );
      if (!response.ok) throw new Error("Erro ao atualizar redespacho da rota");
      fetchRotas();
    } catch (err) {
      setError("Erro ao atualizar redespacho da rota");
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ color: "#2563eb", fontSize: 28, fontWeight: "bold" }}>
            Rotas
          </h1>
          <button
            onClick={() => {
              setShowUploadModal(true);
              setUploadRota("");
              setUploadFiles(null);
              setError("");
              setRedespacho(false);
            }}
            style={{
              padding: "12px 24px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            + Adicionar Notas por Rota
          </button>
        </div>
        {showUploadModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                width: "100%",
                maxWidth: 400,
                minWidth: 0,
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <h2 style={{ marginBottom: 20, color: "#2563eb" }}>
                Cadastrar Notas por Rota
              </h2>
              <form onSubmit={handleUploadNotasPorRota}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    Número da Rota
                  </label>
                  <input
                    type="text"
                    value={uploadRota}
                    onChange={(e) => setUploadRota(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={redespacho}
                      onChange={(e) => setRedespacho(e.target.checked)}
                    />
                    Redespacho (múltiplos motoristas)
                  </label>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    XMLs das Notas (múltiplos)
                  </label>
                  <input
                    type="file"
                    accept=".xml,application/xml,text/xml"
                    multiple
                    onChange={(e) => setUploadFiles(e.target.files)}
                    style={{ width: "100%" }}
                    required
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    style={{
                      padding: "8px 16px",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    {uploading ? "Enviando..." : "Enviar"}
                  </button>
                </div>
                {error && (
                  <div
                    style={{
                      color: "#dc2626",
                      marginTop: 10,
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <input
            type="text"
            placeholder="Pesquisar rota pelo número..."
            value={pesquisaRota}
            onChange={(e) => setPesquisaRota(e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              minWidth: 220,
            }}
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              minWidth: 140,
              marginLeft: 18,
            }}
          >
            <option value="Pendente">Pendentes</option>
            <option value="Entregue">Entregues</option>
            <option value="Todas">Todas</option>
          </select>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", color: "#2563eb" }}>
            Carregando rotas...
          </div>
        ) : error ? (
          <div style={{ color: "#dc2626", textAlign: "center" }}>{error}</div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Número da Rota
                  </th>
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Quantidade de Notas
                  </th>
                  <th
                    style={{ padding: 16, fontWeight: 600, color: "#374151" }}
                  >
                    Status
                  </th>
                  <th style={{ padding: 16 }}></th>
                </tr>
              </thead>
              <tbody>
                {rotas
                  .filter((rota) => {
                    const todasEntregues =
                      rota.notas.length > 0 &&
                      rota.notas.every((n) => n.statusEntrega === "Entregue");
                    const statusRota = todasEntregues ? "Entregue" : "Pendente";
                    // Filtro por status
                    if (
                      filtroStatus === "Pendente" &&
                      statusRota !== "Pendente"
                    )
                      return false;
                    if (
                      filtroStatus === "Entregue" &&
                      statusRota !== "Entregue"
                    )
                      return false;
                    // Filtro por número
                    return pesquisaRota.trim() === ""
                      ? true
                      : rota.numero
                          .toLowerCase()
                          .includes(pesquisaRota.toLowerCase());
                  })
                  .map((rota) => {
                    const todasEntregues =
                      rota.notas.length > 0 &&
                      rota.notas.every((n) => n.statusEntrega === "Entregue");
                    const statusRota = todasEntregues ? "Entregue" : "Pendente";
                    return (
                      <tr
                        key={rota.id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: 16 }}>{rota.numero}</td>
                        <td style={{ padding: 16 }}>{rota.notas.length}</td>
                        <td style={{ padding: 16 }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                statusRota === "Entregue"
                                  ? "#059669"
                                  : "#f59e42",
                              background:
                                statusRota === "Entregue"
                                  ? "#e0faea"
                                  : "#fff7ed",
                              borderRadius: 8,
                              padding: "4px 12px",
                            }}
                          >
                            {statusRota}
                          </span>
                        </td>
                        <td style={{ padding: 16 }}>
                          <Link
                            to={`/rotas/${rota.id}`}
                            style={{
                              color: "#2563eb",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                          >
                            Ver notas
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Rotas;
