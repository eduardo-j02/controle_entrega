import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Ocorrencia {
  id: number;
  entregaId: number;
  descricao: string;
  createdAt: string;
  data?: string; // Adicionado para refletir o retorno do backend
  fotos: { id: number; filename: string }[];
  entrega?: {
    id: number;
    numero?: string;
    cliente?: string;
    nota?: { numero?: string; cliente?: string };
  };
  status: string; // Adicionado para filtro funcionar
  solucao?: string; // Adicionado para refletir o retorno do backend
  protocoloErp?: string; // Adicionado para refletir o retorno do backend
  dataFinalizacao?: string; // Adicionado para refletir o retorno do backend
  finalizadaPorId?: number; // Adicionado para refletir o retorno do backend
  finalizadaPor?: { nome: string }; // Adicionado para refletir o retorno do backend
}

const Ocorrencias: React.FC = () => {
  const { token } = useAuth();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detalhe, setDetalhe] = useState<Ocorrencia | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroNF, setFiltroNF] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const limparFiltros = () => {
    setFiltroStatus("");
    setFiltroCliente("");
    setFiltroNF("");
    setFiltroData("");
  };

  useEffect(() => {
    fetchOcorrencias();
    // eslint-disable-next-line
  }, []);

  const fetchOcorrencias = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_URL}/ocorrencias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Erro ao buscar ocorrências");
      const data = await resp.json();
      setOcorrencias(data);
    } catch (err) {
      setError("Erro ao buscar ocorrências");
    } finally {
      setLoading(false);
    }
  };

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    if (filtroStatus && o.status !== filtroStatus) return false;
    if (
      filtroCliente &&
      !(o.entrega?.nota?.cliente || "")
        .toLowerCase()
        .includes(filtroCliente.toLowerCase())
    )
      return false;
    if (
      filtroNF &&
      !(o.entrega?.nota?.numero || "").toString().includes(filtroNF)
    )
      return false;
    if (filtroData && o.createdAt.slice(0, 10) !== filtroData) return false;
    return true;
  });

  return (
    <Layout>
      <h2
        style={{
          margin: "24px 0 16px 0",
          color: "#2563eb",
          textAlign: "center",
        }}
      >
        Ocorrências
      </h2>
      {/* Filtro de pesquisa deve ser sempre exibido */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 18,
          alignItems: "flex-end",
        }}
      >
        <div>
          <label>
            Status
            <br />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ padding: 6, borderRadius: 6 }}
            >
              <option value="">Todos</option>
              <option value="ABERTA">Aberta</option>
              <option value="FECHADA">Fechada</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Cliente
            <br />
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Nome do cliente"
              style={{ padding: 6, borderRadius: 6, width: 180 }}
            />
          </label>
        </div>
        <div>
          <label>
            Nº NF
            <br />
            <input
              type="text"
              value={filtroNF}
              onChange={(e) => setFiltroNF(e.target.value)}
              placeholder="Número NF"
              style={{ padding: 6, borderRadius: 6, width: 100 }}
            />
          </label>
        </div>
        <div>
          <label>
            Data
            <br />
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              style={{ padding: 6, borderRadius: 6 }}
            />
          </label>
        </div>
        <button
          onClick={limparFiltros}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Limpar
        </button>
      </div>
      {loading ? (
        <div>Carregando...</div>
      ) : error ? (
        <div style={{ color: "#dc2626" }}>{error}</div>
      ) : ocorrenciasFiltradas.length === 0 ? (
        <div>Nenhuma ocorrência encontrada.</div>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px #0001",
              borderCollapse: "separate",
              borderSpacing: 0,
              overflow: "hidden",
            }}
          >
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center",
                  }}
                >
                  Nº NF
                </th>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "left",
                  }}
                >
                  Cliente
                </th>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "left",
                  }}
                >
                  Descrição
                </th>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center",
                  }}
                >
                  Data
                </th>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center",
                  }}
                >
                  Fotos
                </th>
                <th
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {ocorrenciasFiltradas.map((o, idx) => (
                <tr
                  key={o.id}
                  style={{
                    background: idx % 2 === 0 ? "#f9fafb" : "#fff",
                    borderBottom: "1px solid #f1f5f9",
                    height: 56,
                  }}
                >
                  <td
                    style={{
                      padding: 10,
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {o.id}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {o.entrega?.nota?.numero || "-"}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      textAlign: "left",
                      verticalAlign: "middle",
                    }}
                  >
                    {o.entrega?.nota?.cliente || "-"}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      textAlign: "left",
                      verticalAlign: "middle",
                    }}
                  >
                    {o.descricao}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {o.data ? new Date(o.data).toLocaleString("pt-BR") : "-"}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {o.fotos && o.fotos.length > 0
                      ? o.fotos.map((f) => (
                          <a
                            key={f.id}
                            href={`${API_URL}/arquivos/ocorrencias/${f.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver foto"
                            style={{
                              marginRight: 6,
                              display: "inline-block",
                              verticalAlign: "middle",
                            }}
                          >
                            <img
                              src={`${API_URL}/arquivos/ocorrencias/${f.filename}`}
                              alt="Foto"
                              style={{
                                width: 36,
                                height: 36,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 1px 4px #0001",
                                verticalAlign: "middle",
                              }}
                            />
                          </a>
                        ))
                      : "-"}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <button
                      onClick={() => setDetalhe(o)}
                      style={{
                        background:
                          "linear-gradient(90deg, #2563eb 60%, #1e40af 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 18px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 1px 4px #0001",
                      }}
                    >
                      Detalhes / Fechar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Modal de detalhes e fechamento */}
      {detalhe && (
        <DetalheOcorrencia
          ocorrencia={detalhe}
          onClose={() => setDetalhe(null)}
          onFechou={fetchOcorrencias}
        />
      )}
    </Layout>
  );
};

export default Ocorrencias;

// Componente de detalhes e fechamento
const DetalheOcorrencia: React.FC<{
  ocorrencia: Ocorrencia;
  onClose: () => void;
  onFechou: () => void;
}> = ({ ocorrencia, onClose, onFechou }) => {
  const { token } = useAuth();
  const [solucao, setSolucao] = useState("");
  const [protocoloErp, setProtocoloErp] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const handleFechar = async () => {
    if (!protocoloErp.trim()) {
      setErro("O ID do protocolo no ERP é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const resp = await fetch(
        `${API_URL}/ocorrencias/${ocorrencia.id}/fechar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ solucao, protocoloErp }),
        }
      );
      if (!resp.ok) {
        const errData = await resp.json();
        setErro(errData.error || "Erro ao fechar ocorrência");
        setSalvando(false);
        return;
      }
      onFechou();
      onClose();
    } catch (err) {
      setErro("Erro ao fechar ocorrência");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(30, 64, 175, 0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          minWidth: 340,
          maxWidth: 480,
          boxShadow: "0 4px 32px #0002",
        }}
      >
        <h3 style={{ color: "#2563eb", marginBottom: 12 }}>
          Detalhes da Ocorrência #{ocorrencia.id}
        </h3>
        <div style={{ marginBottom: 8 }}>
          <b>Entrega:</b> {ocorrencia.entrega?.numero || ocorrencia.entregaId}
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {ocorrencia.entrega?.cliente}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>Descrição:</b> {ocorrencia.descricao}
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>Data:</b>{" "}
          {ocorrencia.data
            ? new Date(ocorrencia.data).toLocaleString("pt-BR")
            : "-"}
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>Fotos:</b>{" "}
          {ocorrencia.fotos && ocorrencia.fotos.length > 0
            ? ocorrencia.fotos.map((f) => (
                <a
                  key={f.id}
                  href={`${API_URL}/arquivos/ocorrencias/${f.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver foto"
                  style={{ marginRight: 8, display: "inline-block" }}
                >
                  <img
                    src={`${API_URL}/arquivos/ocorrencias/${f.filename}`}
                    alt="Foto"
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 4px #0001",
                    }}
                  />
                </a>
              ))
            : "-"}
        </div>
        <hr style={{ margin: "18px 0" }} />
        {ocorrencia.status === "FECHADA" ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <b>Solução:</b> {ocorrencia.solucao || "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>ID do Protocolo no ERP:</b> {ocorrencia.protocoloErp || "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Data de Finalização:</b>{" "}
              {ocorrencia.dataFinalizacao
                ? new Date(ocorrencia.dataFinalizacao).toLocaleString("pt-BR")
                : "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Finalizado por:</b> {ocorrencia.finalizadaPor?.nome || "-"}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px #0001",
                }}
              >
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label>
                <b>Solução:</b>
                <textarea
                  value={solucao}
                  onChange={(e) => setSolucao(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    padding: 8,
                  }}
                  placeholder="Descreva a solução adotada..."
                />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <label>
                <b>ID do Protocolo no ERP:</b>
                <input
                  type="text"
                  value={protocoloErp}
                  onChange={(e) => setProtocoloErp(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    padding: 8,
                    marginTop: 4,
                  }}
                  required
                />
              </label>
            </div>
            {erro && (
              <div style={{ color: "#dc2626", marginTop: 8 }}>{erro}</div>
            )}
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleFechar}
                disabled={salvando}
                style={{
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px #0001",
                }}
              >
                {salvando ? "Salvando..." : "Fechar Ocorrência"}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px #0001",
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
