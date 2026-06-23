import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useApiFetch } from "../utils/api";

interface Nota {
  id: number;
  numero: string;
  destinatario: string;
  dataEmissao: string;
  arquivo: string;
  createdAt: string;
  rotaId?: number | null;
  rotaNumero?: string;
  chaveXml?: string;
}

const Notas: React.FC = () => {
  const { token, pingToken, forceLogout } = useAuth();
  const { fetch: apiFetch, downloadFile } = useApiFetch();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadRota, setUploadRota] = useState("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [notasDuplicadas, setNotasDuplicadas] = useState<string[]>([]);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    (async () => {
      if (typeof pingToken === "function") {
        const ok = await pingToken();
        if (!ok) {
          forceLogout();
          return;
        }
      }
      fetchNotas();
    })();
  }, []);

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${API_URL}/notas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao carregar notas");
      const data = await response.json();
      setNotas(data);
    } catch (err) {
      setError("Erro ao carregar notas");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleUploadNotasPorRota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadRota || !uploadFiles || uploadFiles.length === 0) {
      setError("Informe o número da rota e selecione pelo menos um XML");
      return;
    }
    setUploading(true);
    setError("");
    setNotasDuplicadas([]);
    try {
      const formData = new FormData();
      formData.append("rotaNumero", uploadRota);
      for (let i = 0; i < uploadFiles.length; i++) {
        formData.append("xmls", uploadFiles[i]);
      }
      const response = await apiFetch(`${API_URL}/notas/rota`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
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
      setNotasDuplicadas(data.notasDuplicadas || []);
      fetchNotas();
    } catch (err) {
      setError("Erro ao enviar notas");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ color: "#2563eb", fontSize: 28, fontWeight: "bold" }}>
            Notas Fiscais
          </h1>
          <button
            onClick={() => setShowUploadModal(true)}
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
            + Nova Nota
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", color: "#2563eb" }}>
            Carregando notas...
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
            {notasDuplicadas.length > 0 && (
              <div
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20,
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                As seguintes notas não foram cadastradas pois já existem no
                sistema:
                <br />
                {notasDuplicadas.map((chave, idx) => (
                  <span key={chave}>
                    {chave}
                    {idx < notasDuplicadas.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
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
                    Rota
                  </th>
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    NF-e
                  </th>
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Destinatário
                  </th>
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Data Emissão
                  </th>
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Chave NFe
                  </th>
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Arquivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => (
                  <tr
                    key={nota.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: 16 }}>{nota.rotaNumero ?? ""}</td>
                    <td style={{ padding: 16 }}>{nota.numero}</td>
                    <td style={{ padding: 16 }}>{nota.destinatario}</td>
                    <td style={{ padding: 16 }}>
                      {formatDate(nota.dataEmissao)}
                    </td>
                    <td style={{ padding: 16 }}>{nota.chaveXml ?? ""}</td>
                    <td style={{ padding: 16 }}>
                      <button
                        onClick={() => {
                          downloadFile(
                            `${API_URL}/notas/${nota.id}/arquivo`,
                            nota.arquivo
                          ).catch((error: any) => {
                            console.error("Erro ao baixar XML:", error);
                            alert(
                              "Erro ao baixar XML. Verifique se você está logado."
                            );
                          });
                        }}
                        style={{
                          color: "#2563eb",
                          textDecoration: "underline",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          font: "inherit",
                        }}
                      >
                        Baixar XML
                      </button>{" "}
                      <button
                        onClick={() => {
                          downloadFile(
                            `${API_URL}/notas/${nota.id}/pdf`,
                            `nota_${nota.id}.pdf`
                          ).catch((error: any) => {
                            console.error("Erro ao baixar PDF:", error);
                            alert(
                              "Erro ao baixar PDF. Verifique se você está logado."
                            );
                          });
                        }}
                        style={{
                          color: "#059669",
                          textDecoration: "underline",
                          fontWeight: 500,
                          marginLeft: 12,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          font: "inherit",
                        }}
                      >
                        Baixar PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de upload de nota */}
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
      </div>
    </Layout>
  );
};

export default Notas;
