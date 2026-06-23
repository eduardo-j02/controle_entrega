import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

const AlterarPerfil: React.FC = () => {
  const { user, userName, loading, error, updateProfile } = useAuth();
  const [nome, setNome] = useState(user || "");
  const [username] = useState(userName || "");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"success" | "error">(
    "success"
  );
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem("");

    if (nome === user) {
      setMensagem("Nenhuma alteração foi feita");
      setTipoMensagem("error");
      return;
    }

    try {
      await updateProfile({ nome });
      setMensagem("Perfil atualizado com sucesso!");
      setTipoMensagem("success");
    } catch (err: any) {
      setMensagem(err.response?.data?.message || "Erro ao atualizar perfil");
      setTipoMensagem("error");
    }
  };

  return (
    <Layout>
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: "linear-gradient(120deg, #e0e7ff 0%, #f7f8fa 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 64,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 8px 40px 0 rgba(30,64,175,0.13)",
            padding: "38px 36px",
            minWidth: 340,
            maxWidth: 400,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 8,
              color: "#2563eb",
              textAlign: "center",
            }}
          >
            Alterar Perfil
          </h2>
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="nome" style={{ fontWeight: 500 }}>
                Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #c7d2fe",
                  borderRadius: 8,
                  fontSize: 16,
                  background: "#f1f5f9",
                  outline: "none",
                  transition: "border 0.2s",
                }}
                autoComplete="name"
                disabled={loading}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="username" style={{ fontWeight: 500 }}>
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #c7d2fe",
                  borderRadius: 8,
                  fontSize: 16,
                  background: "#e2e8f0",
                  outline: "none",
                  color: "#64748b",
                  cursor: "not-allowed",
                }}
                autoComplete="username"
              />
              <small style={{ color: "#64748b", fontSize: 12 }}>
                O nome de usuário não pode ser alterado
              </small>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 0",
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(90deg, #2563eb 60%, #1e40af 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 17,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(30,64,175,0.08)",
                transition: "background 0.2s, transform 0.1s",
                marginTop: 8,
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#1e40af";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #2563eb 60%, #1e40af 100%)";
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "scale(0.98)";
                }
              }}
              onMouseUp={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </form>
          <button
            onClick={() => navigate("/alterar-senha")}
            style={{
              marginTop: 16,
              background: "none",
              border: "none",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Alterar senha
          </button>
          {mensagem && (
            <div
              style={{
                color: tipoMensagem === "success" ? "#059669" : "#dc2626",
                marginTop: 8,
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              {mensagem}
            </div>
          )}
          {error && (
            <div
              style={{ color: "#dc2626", marginTop: 8, textAlign: "center" }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AlterarPerfil;
