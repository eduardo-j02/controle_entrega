import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { FaExchangeAlt } from "react-icons/fa";

const Entregas: React.FC = () => {
  const { token, role } = useAuth();
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Pendentes");
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [filtroRota, setFiltroRota] = useState("");
  const [detalheEntrega, setDetalheEntrega] = useState<any | null>(null);
  const [showDetalheModal, setShowDetalheModal] = useState(false);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const [error, setError] = useState("");

  async function fetchEntregas() {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/entregas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Erro ao carregar entregas");
      const data = await response.json();
      setEntregas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erro ao carregar entregas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEntregas();
  }, [token]);

  async function abrirDetalhesEntrega(id: number) {
    setShowDetalheModal(true);
    setLoadingDetalhe(true);
    setErroDetalhe("");
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/entregas/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Erro ao buscar detalhes da entrega");
      const data = await response.json();
      setDetalheEntrega(data);
    } catch (err) {
      setErroDetalhe("Erro ao buscar detalhes da entrega");
      setDetalheEntrega(null);
    } finally {
      setLoadingDetalhe(false);
    }
  }

  async function desvincularMotorista(entregaId: number) {
    if (
      window.confirm(
        "Tem certeza que deseja desvincular o motorista desta entrega?"
      )
    ) {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${API_URL}/entregas/${entregaId}/desvincular`,
          {
            method: "PUT",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!response.ok) {
          const errData = await response.json();
          alert(errData.error || "Erro ao desvincular motorista.");
          return;
        }
        alert("Motorista desvinculado com sucesso!");
        fetchEntregas();
      } catch (err) {
        alert("Erro ao desvincular motorista.");
      }
    }
  }

  // Controle de acesso
  if (!role || !["SUPERADMIN", "ADMIN", "GESTOR"].includes(role)) {
    return (
      <Layout>
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ color: "#ef4444" }}>Acesso não autorizado</h2>
        </div>
      </Layout>
    );
  }

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
            Entregas
          </h1>
        </div>
        {error && (
          <div style={{ color: "#dc2626", background: "#fee2e2", borderRadius: 6, padding: "8px 16px", marginBottom: 16 }}>
            {error}
          </div>
        )}
        {/* Filtros */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          >
            <option value="Pendentes">Pendentes</option>
            <option value="Entregues">Entregues</option>
            <option value="Todas">Todas</option>
          </select>
          <input
            type="text"
            placeholder="Motorista"
            value={filtroMotorista}
            onChange={(e) => setFiltroMotorista(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />
          <input
            type="text"
            placeholder="Rota"
            value={filtroRota}
            onChange={(e) => setFiltroRota(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />
        </div>
        {/* Tabela de entregas */}
        <div
          style={{ background: "white", borderRadius: 12, overflow: "hidden" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th style={{ padding: 12, textAlign: "left" }}>Rota</th>
                <th style={{ padding: 12, textAlign: "left" }}>NF</th>
                <th style={{ padding: 12, textAlign: "left" }}>Data Entrega</th>
                <th style={{ padding: 12, textAlign: "left" }}>Cliente</th>
                <th style={{ padding: 12, textAlign: "left" }}>Motoristas</th>
                <th style={{ padding: 12, textAlign: "left" }}>Status</th>
                <th style={{ padding: 12, textAlign: "left" }}>Redespacho</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    Carregando...
                  </td>
                </tr>
              ) : entregas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    Nenhuma entrega encontrada
                  </td>
                </tr>
              ) : (
                // Agrupar entregas por notaId e mostrar só a mais recente
                Object.values(
                  entregas.reduce((acc: any, entrega: any) => {
                    const key =
                      entrega.numeroNF || entrega.notaId || entrega.nota_id;
                    if (!key) return acc;
                    if (!acc[key]) acc[key] = entrega;
                    else {
                      // Se já existe, pega a mais recente
                      const dataA = new Date(
                        acc[key].dataEntrega || acc[key].createdAt || 0
                      );
                      const dataB = new Date(
                        entrega.dataEntrega || entrega.createdAt || 0
                      );
                      if (dataB > dataA) acc[key] = entrega;
                    }
                    return acc;
                  }, {} as Record<string, any>)
                )
                  .filter(Boolean)
                  .filter((entrega: any) => {
                    // Filtro por status
                    const statusFilter = () => {
                      if (filtroStatus === "Todas") return true;
                      if (filtroStatus === "Pendentes")
                        return entrega.status !== "Entregue";
                      if (filtroStatus === "Entregues")
                        return entrega.status === "Entregue";
                      return true;
                    };

                    const motoristaOk =
                      !filtroMotorista ||
                      (Array.isArray(entrega.motoristas)
                        ? entrega.motoristas.some((m: any) =>
                            m.nome
                              .toLowerCase()
                              .includes(filtroMotorista.toLowerCase())
                          )
                        : (entrega.nomeMotorista || "")
                            .toLowerCase()
                            .includes(filtroMotorista.toLowerCase()));
                    const rotaOk =
                      !filtroRota ||
                      (entrega.numeroRota || "")
                        .toLowerCase()
                        .includes(filtroRota.toLowerCase());
                    return statusFilter() && motoristaOk && rotaOk;
                  })
                  .map((entrega: any) => (
                    <tr key={entrega.id}>
                      <td style={{ padding: 12 }}>
                        {entrega.numeroRota || "-"}
                      </td>
                      <td style={{ padding: 12 }}>{entrega.numeroNF || "-"}</td>
                      <td style={{ padding: 12 }}>
                        {(() => {
                          if (
                            !entrega.dataEntrega ||
                            entrega.dataEntrega === "-"
                          )
                            return "-";
                          const d = new Date(entrega.dataEntrega);
                          if (isNaN(d.getTime())) return "-";
                          const pad = (v: number) =>
                            v.toString().padStart(2, "0");
                          return `${pad(d.getDate())}/${pad(
                            d.getMonth() + 1
                          )}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
                            d.getMinutes()
                          )}`;
                        })()}
                      </td>
                      <td style={{ padding: 12 }}>{entrega.cliente || "-"}</td>
                      <td style={{ padding: 12 }}>
                        {Array.isArray(entrega.motoristas) &&
                        entrega.motoristas.length > 0
                          ? entrega.motoristas
                              .map((m: any) => m.nome)
                              .join(", ")
                          : entrega.nomeMotorista || "-"}
                      </td>
                      <td style={{ padding: 12 }}>{entrega.status}</td>
                      <td style={{ padding: 12, textAlign: "center" }}>
                        {entrega.redespacho ? (
                          <span
                            title="Redespacho"
                            style={{
                              color: "#2563eb",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <FaExchangeAlt /> Redespacho
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() => abrirDetalhesEntrega(entrega.id)}
                            style={{
                              background: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 16px",
                              cursor: "pointer",
                              fontWeight: 500,
                            }}
                          >
                            Detalhes
                          </button>
                          {entrega.status !== "Entregue" && (
                            <button
                              onClick={() => desvincularMotorista(entrega.id)}
                              style={{
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: 6,
                                padding: "6px 16px",
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                            >
                              Desvincular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        {/* Modal de criação de entrega (placeholder) */}
        {/* Remova também qualquer referência a setShowCreateModal(true), showCreateModal e o modal relacionado. */}
        {/* Modal de detalhes da entrega */}
        {showDetalheModal && detalheEntrega && (
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
                maxWidth: 600,
                minWidth: 0,
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <h2>Detalhes da Entrega</h2>
              {loadingDetalhe ? (
                <p>Carregando...</p>
              ) : erroDetalhe ? (
                <p style={{ color: "#ef4444" }}>{erroDetalhe}</p>
              ) : detalheEntrega ? (
                <div style={{ fontSize: 15 }}>
                  <div>
                    <b>ID:</b> {detalheEntrega.id}
                  </div>
                  <div>
                    <b>Status:</b> {detalheEntrega.status || "-"}
                  </div>
                  <div>
                    <b>Nota ID:</b> {detalheEntrega.notaId || "-"}
                  </div>
                  <div>
                    <b>Data Entrega:</b>{" "}
                    {detalheEntrega.dataEntrega
                      ? new Date(detalheEntrega.dataEntrega).toLocaleString()
                      : "-"}
                  </div>
                  <div>
                    <b>Comprovante:</b>{" "}
                    {detalheEntrega.comprovante ? (
                      <button
                        onClick={async () => {
                          const API_URL = import.meta.env.VITE_API_URL;
                          try {
                            const response = await fetch(
                              `${API_URL}/entregas/${detalheEntrega.id}/comprovante`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            if (!response.ok) {
                              if (response.status === 401) {
                                alert("Sessão expirada. Faça login novamente.");
                                return;
                              }
                              throw new Error(
                                `Erro ao baixar comprovante: ${response.status}`
                              );
                            }

                            const blob = await response.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = detalheEntrega.comprovante;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                          } catch (error: any) {
                            console.error("Erro ao baixar comprovante:", error);
                            alert(
                              "Erro ao baixar comprovante. Verifique se você está logado."
                            );
                          }
                        }}
                        style={{
                          color: "#2563eb",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          font: "inherit",
                        }}
                      >
                        Ver arquivo
                      </button>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div>
                    <b>Latitude:</b> {detalheEntrega.latitude || "-"}
                  </div>
                  <div>
                    <b>Longitude:</b> {detalheEntrega.longitude || "-"}
                  </div>
                  <div>
                    <b>Data Criação:</b>{" "}
                    {detalheEntrega.createdAt
                      ? new Date(detalheEntrega.createdAt).toLocaleString()
                      : "-"}
                  </div>
                  <div>
                    <b>Motorista ID:</b> {detalheEntrega.motoristaId || "-"}
                  </div>
                  <div>
                    <b>Rota ID:</b> {detalheEntrega.rotaId || "-"}
                  </div>
                  <div>
                    <b>Data Finalização:</b>{" "}
                    {detalheEntrega.dataFinalizacao
                      ? new Date(
                          detalheEntrega.dataFinalizacao
                        ).toLocaleString()
                      : "-"}
                  </div>
                </div>
              ) : null}
              {detalheEntrega &&
                detalheEntrega.redespacho &&
                detalheEntrega.motoristas && (
                  <div
                    style={{
                      background: "#f3f4f6",
                      borderRadius: 8,
                      padding: 16,
                      margin: "16px 0",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#2563eb",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FaExchangeAlt /> Redespacho
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Motoristas do Redespacho:
                    </div>
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                      {detalheEntrega.motoristas.map((m: any, idx: number) => {
                        let status = "";
                        if (
                          detalheEntrega.status === "Entregue" &&
                          idx === detalheEntrega.motoristas.length - 1
                        )
                          status = "(Finalizou)";
                        else if (
                          detalheEntrega.status !== "Entregue" &&
                          idx ===
                            detalheEntrega.motoristas.findIndex(
                              (mot: any) => !mot.dataTransferencia
                            )
                        )
                          status = "(Atual)";
                        else if (m.dataTransferencia) status = "(Transferiu)";
                        return (
                          <li key={m.id} style={{ marginBottom: 2 }}>
                            <span style={{ fontWeight: 500 }}>{m.nome}</span>{" "}
                            <span style={{ color: "#6b7280", fontSize: 13 }}>
                              {status}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 24,
                  justifyContent: "flex-start",
                }}
              >
                <button
                  onClick={() => setShowDetalheModal(false)}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 24px",
                    fontWeight: 600,
                  }}
                >
                  Fechar
                </button>
                {detalheEntrega.status === "Entregue" && (
                  <button
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                    onClick={async () => {
                      const API_URL = import.meta.env.VITE_API_URL;
                      try {
                        const response = await fetch(
                          `${API_URL}/entregas/${detalheEntrega.id}/dossie`,
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        if (!response.ok) {
                          if (response.status === 401) {
                            alert("Sessão expirada. Faça login novamente.");
                            return;
                          }
                          throw new Error(
                            `Erro ao baixar dossiê: ${response.status}`
                          );
                        }

                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `dossie_entrega_${detalheEntrega.id}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error: any) {
                        console.error("Erro ao baixar dossiê:", error);
                        alert(
                          "Erro ao baixar dossiê. Verifique se você está logado."
                        );
                      }
                    }}
                  >
                    Baixar Dossiê (PDF)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Entregas;
