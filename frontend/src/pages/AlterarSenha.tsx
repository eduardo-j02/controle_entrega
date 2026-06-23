import React, { useState } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changePasswordApi } from "../api/auth";

const AlterarSenha: React.FC = () => {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"success" | "error">(
    "success"
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userId, token, userName } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem("");

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMensagem("Preencha todos os campos.");
      setTipoMensagem("error");
      return;
    }
    if (novaSenha.length < 6) {
      setMensagem("A nova senha deve ter pelo menos 6 caracteres.");
      setTipoMensagem("error");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMensagem("A confirmação da senha não confere.");
      setTipoMensagem("error");
      return;
    }
    if (!userId || !token) {
      setMensagem("Usuário não autenticado.");
      setTipoMensagem("error");
      return;
    }
    setLoading(true);
    try {
      await changePasswordApi(userId, { senhaAtual, novaSenha }, token);
      setMensagem("Senha alterada com sucesso!");
      setTipoMensagem("success");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      setMensagem(err.response?.data?.error || "Erro ao alterar senha");
      setTipoMensagem("error");
    } finally {
      setLoading(false);
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
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 8,
              color: "#2563eb",
              textAlign: "center",
            }}
          >
            Alterar Senha
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
            {/* Campo oculto para acessibilidade */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                opacity: 0,
              }}
              value={userName || ""}
              readOnly
              aria-hidden="true"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="senhaAtual" style={{ fontWeight: 500 }}>
                Senha atual
              </label>
              <input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
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
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="novaSenha" style={{ fontWeight: 500 }}>
                Nova senha
              </label>
              <input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha"
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
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="confirmarSenha" style={{ fontWeight: 500 }}>
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
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
                autoComplete="new-password"
                disabled={loading}
              />
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
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </form>
          <button
            onClick={() => navigate(-1)}
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
            Voltar
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
        </div>
      </div>
    </Layout>
  );
};

export default AlterarSenha;
