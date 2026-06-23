import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApiFetch } from "../utils/api";

interface Nota {
  id: number;
  numero: string;
  destinatario: string;
  dataEmissao: string;
  arquivo: string;
  createdAt: string;
  chaveXml?: string;
  cliente?: string;
  redespacho?: boolean;
}

interface Rota {
  id: number;
  numero: string;
  notas: Nota[];
}

const NotasPorRota: React.FC = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { downloadFile } = useApiFetch();
  const [rota, setRota] = useState<Rota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchRota();
  }, [id, token]);

  const fetchRota = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notas/rotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao carregar rotas");
      const data: Rota[] = await response.json();
      const rotaEncontrada = data.find((r) => String(r.id) === String(id));
      setRota(rotaEncontrada || null);
    } catch (err) {
      setError("Erro ao carregar notas da rota");
    } finally {
      setLoading(false);
    }
  };

  const atualizarRedespachoNota = async (
    notaId: number,
    redespacho: boolean
  ) => {
    try {
      const response = await fetch(`${API_URL}/notas/${notaId}/redespacho`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ redespacho }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar redespacho da nota");
      fetchRota();
    } catch (err) {
      setError("Erro ao atualizar redespacho da nota");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Link
            to="/rotas"
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            ← Voltar para Rotas
          </Link>
          <button
            onClick={fetchRota}
            style={{
              padding: "6px 16px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            Atualizar
          </button>
        </div>
        <h1
          style={{
            color: "#2563eb",
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 24,
          }}
        >
          Notas da Rota {rota?.numero}
        </h1>
        {loading ? (
          <div style={{ textAlign: "center", color: "#2563eb" }}>
            Carregando notas...
          </div>
        ) : error ? (
          <div style={{ color: "#dc2626", textAlign: "center" }}>{error}</div>
        ) : !rota ? (
          <div style={{ color: "#dc2626", textAlign: "center" }}>
            Rota não encontrada.
          </div>
        ) : rota.notas.length === 0 ? (
          <div style={{ color: "#374151", textAlign: "center" }}>
            Nenhuma nota cadastrada para esta rota.
          </div>
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
                  <th
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Redespacho
                  </th>
                </tr>
              </thead>
              <tbody>
                {rota.notas.map((nota) => (
                  <tr
                    key={nota.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
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
                    <td style={{ padding: 16 }}>
                      <input
                        type="checkbox"
                        checked={!!nota.redespacho}
                        onChange={(e) =>
                          atualizarRedespachoNota(nota.id, e.target.checked)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotasPorRota;
