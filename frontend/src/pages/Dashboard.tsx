import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useApiFetch } from "../utils/api";

const Dashboard: React.FC = () => {
  const { user, logout, token, pingToken, forceLogout } = useAuth();
  const { fetch: apiFetch } = useApiFetch();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [notasRegistradas, setNotasRegistradas] = useState<number>(0);
  const [notasEntregues, setNotasEntregues] = useState<number>(0);
  const [ocorrencias, setOcorrencias] = useState<number>(0); // manter mockado por enquanto
  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState<number>(0); // manter mockado por enquanto
  const [notasComMotorista, setNotasComMotorista] = useState<number>(0);
  const [entregasRedespachoEmPosse, setEntregasRedespachoEmPosse] =
    useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (typeof pingToken === "function") {
        const ok = await pingToken();
        if (!ok) {
          forceLogout();
          return;
        }
      }
      // agora sim, navegação já existente
      if (!user) navigate("/");
    })();
    // eslint-disable-next-line
  }, [user, navigate]);

  useEffect(() => {
    const fetchResumo = async () => {
      setLoading(true);
      setError("");
      try {
        // Buscar notas
        const notasResp = await apiFetch(`${API_URL}/notas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!notasResp.ok) throw new Error("Erro ao buscar notas");
        const notas = await notasResp.json();
        setNotasRegistradas(Array.isArray(notas) ? notas.length : 0);

        // Buscar entregas
        const entregasResp = await apiFetch(`${API_URL}/entregas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!entregasResp.ok) throw new Error("Erro ao buscar entregas");
        const entregas = await entregasResp.json();
        setNotasEntregues(
          Array.isArray(entregas)
            ? entregas.filter((e: any) => {
                // Considera como data base a dataEntrega (se existir) ou createdAt
                const dataEntregaStr =
                  e.dataEntrega && e.dataEntrega !== "-"
                    ? e.dataEntrega
                    : e.createdAt;
                if (!dataEntregaStr || dataEntregaStr === "-") return false;
                const dataEntrega = new Date(dataEntregaStr);
                const now = new Date();
                return (
                  e.status === "Entregue" &&
                  dataEntrega.getMonth() === now.getMonth() &&
                  dataEntrega.getFullYear() === now.getFullYear()
                );
              }).length
            : 0
        );
        setNotasComMotorista(
          Array.isArray(entregas)
            ? entregas.filter((e: any) => e.status !== "Entregue").length
            : 0
        );
        // Novo: entregas em posse do redespacho
        const emPosse = Array.isArray(entregas)
          ? entregas.filter(
              (e: any) =>
                e.status === "Pendente" &&
                e.redespacho === true &&
                Array.isArray(e.motoristas) &&
                e.motoristas.length > 1
            ).length
          : 0;
        setEntregasRedespachoEmPosse(emPosse);

        // NOVO: buscar total de ocorrências
        const ocorrenciasResp = await apiFetch(
          `${API_URL}/ocorrencias/quantidade`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (ocorrenciasResp.ok) {
          const { total } = await ocorrenciasResp.json();
          setOcorrencias(total);
        } else {
          setOcorrencias(0);
        }
        // NOVO: buscar total de ocorrências em aberto
        const ocorrenciasAbertasResp = await apiFetch(
          `${API_URL}/ocorrencias/abertas/quantidade`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (ocorrenciasAbertasResp.ok) {
          const { total } = await ocorrenciasAbertasResp.json();
          setOcorrenciasAbertas(total);
        } else {
          setOcorrenciasAbertas(0);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchResumo();
    // eslint-disable-next-line
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, #e0e7ff 0%, #f7f8fa 100%)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header onLogout={logout} />
      <Sidebar />
      <main
        style={{
          marginLeft: 210,
          paddingTop: 80,
          minHeight: "calc(100vh - 64px)",
          width: "calc(100vw - 210px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Linha dos três cards principais */}
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)", // agora 4 por linha
            gap: 20,
            justifyItems: "center",
            alignItems: "stretch",
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          {loading ? (
            <div style={{ color: "#2563eb", fontWeight: 500, fontSize: 18 }}>
              Carregando resumo...
            </div>
          ) : error ? (
            <div style={{ color: "#dc2626", fontWeight: 500, fontSize: 18 }}>
              {error}
            </div>
          ) : (
            <>
              <ResumoCard
                icon="📄"
                label="Notas Registradas"
                value={notasRegistradas}
                color="#2563eb"
              />
              <ResumoCard
                icon="🧑‍✈️"
                label="Notas com Motorista"
                value={notasComMotorista}
                color="#a855f7"
              />
              <ResumoCard
                icon="🔄"
                label="Em Posse do Redespacho"
                value={entregasRedespachoEmPosse}
                color="#f59e42"
              />
              <ResumoCard
                icon="📦"
                label="Notas Entregues"
                value={notasEntregues}
                color="#059669"
              />
            </>
          )}
        </div>
        {/* Cards de ocorrências em destaque */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 32,
            marginBottom: 32,
          }}
        >
          <ResumoCard
            icon="⏳"
            label="Ocorrências em Aberto"
            value={ocorrenciasAbertas}
            color="#dc2626"
            destaque
          />
          <ResumoCard
            icon="⚠️"
            label="Total Ocorrências"
            value={ocorrencias}
            color="#f59e42"
            destaque
          />
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 540,
            minHeight: 260,
            background: "#fff",
            borderRadius: 22,
            boxShadow: "0 8px 40px 0 rgba(30,64,175,0.13)",
            padding: "48px 38px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            margin: "0 auto",
            transition: "box-shadow 0.2s, transform 0.2s",
            willChange: "transform",
            cursor: "default",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 16px 48px 0 rgba(30,64,175,0.18)";
            (e.currentTarget as HTMLDivElement).style.transform =
              "translateY(-2px) scale(1.012)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 8px 40px 0 rgba(30,64,175,0.13)";
            (e.currentTarget as HTMLDivElement).style.transform = "none";
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 10 }}>🚚</div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              marginBottom: 8,
              color: "#2563eb",
              textAlign: "center",
              letterSpacing: 0.5,
              textShadow: "0 2px 8px rgba(37,99,235,0.08)",
            }}
          >
            Bem-vindo, {user}!
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "#222",
              textAlign: "center",
              marginBottom: 8,
              lineHeight: 1.5,
            }}
          >
            Este é o painel principal do sistema de controle de entrega.
            <br />
            Utilize o menu lateral para acessar as funcionalidades.
          </p>
        </div>
      </main>
    </div>
  );
};

interface ResumoCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  destaque?: boolean;
}

const ResumoCard: React.FC<ResumoCardProps> = ({
  icon,
  label,
  value,
  color,
  destaque,
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      padding: destaque ? "32px 48px" : "28px 32px",
      minWidth: destaque ? 340 : 210,
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      transition: "box-shadow 0.18s, transform 0.18s",
      cursor: "pointer",
      border: `2px solid ${color}22`,
      borderColor: destaque ? "#dc2626" : `${color}22`,
      boxShadow: destaque
        ? "0 4px 24px 0 #dc262633"
        : "0 2px 12px rgba(30,64,175,0.07)",
      color: destaque ? "#dc2626" : undefined,
      fontWeight: destaque ? 700 : undefined,
      fontSize: destaque ? 20 : undefined,
      textAlign: "center",
    }}
    onMouseOver={(e) => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = destaque
        ? "0 8px 32px 0 #dc262655"
        : "0 8px 24px 0 rgba(30,64,175,0.13)";
      (e.currentTarget as HTMLDivElement).style.transform =
        "translateY(-2px) scale(1.025)";
    }}
    onMouseOut={(e) => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = destaque
        ? "0 4px 24px 0 #dc262633"
        : "0 2px 12px rgba(30,64,175,0.07)";
      (e.currentTarget as HTMLDivElement).style.transform = "none";
    }}
  >
    <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
    <div
      style={{
        fontWeight: 700,
        fontSize: 18,
        color: destaque ? "#dc2626" : color,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 28,
        fontWeight: 900,
        color: destaque ? "#dc2626" : color,
      }}
    >
      {value}
    </div>
  </div>
);

export default Dashboard;
