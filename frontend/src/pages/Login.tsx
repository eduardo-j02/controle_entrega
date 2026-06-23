import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, loading, token } = useAuth();
  const navigate = useNavigate();
  const [expiredMessage, setExpiredMessage] = useState("");

  useEffect(() => {
    if (token && !loading) {
      navigate("/dashboard");
    }
  }, [token, loading, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const logoutReason = localStorage.getItem("logout_reason");
    if (token && logoutReason === "expired") {
      setExpiredMessage("Sua sessão expirou. Faça login novamente.");
      localStorage.removeItem("logout_reason");
    }
    // Caso não haja token, não exibe alerta nenhum
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(username, password);
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(120deg, #e0e7ff 0%, #f7f8fa 100%)",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "#2563eb",
            fontWeight: 600,
          }}
        >
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #e0e7ff 0%, #f7f8fa 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 370,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(30,64,175,0.10)",
          padding: 36,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <img
          src={logo}
          alt="Logo Polar Entregas"
          style={{
            height: 240,
            width: 240,
            margin: "auto",
            display: "block",
          }}
        />

        {expiredMessage && (
          <div
            style={{
              background: "#fcd34d",
              color: "#92400e",
              fontWeight: 700,
              padding: "12px 24px",
              borderRadius: 6,
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            {expiredMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label
              htmlFor="username"
              style={{ fontWeight: 500, color: "#222" }}
            >
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Digite seu usuário"
              style={{
                padding: "10px 12px",
                border: "1px solid #c7d2fe",
                borderRadius: 8,
                fontSize: 16,
                background: "#f1f5f9",
                outline: "none",
                transition: "border 0.2s",
              }}
              autoComplete="username"
              onFocus={(e) =>
                (e.currentTarget.style.border = "#2563eb 1.5px solid")
              }
              onBlur={(e) =>
                (e.currentTarget.style.border = "#c7d2fe 1px solid")
              }
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label
              htmlFor="password"
              style={{ fontWeight: 500, color: "#222" }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
              style={{
                padding: "10px 12px",
                border: "1px solid #c7d2fe",
                borderRadius: 8,
                fontSize: 16,
                background: "#f1f5f9",
                outline: "none",
                transition: "border 0.2s",
              }}
              autoComplete="current-password"
              onFocus={(e) =>
                (e.currentTarget.style.border = "#2563eb 1.5px solid")
              }
              onBlur={(e) =>
                (e.currentTarget.style.border = "#c7d2fe 1px solid")
              }
            />
          </div>
          {error && (
            <div
              style={{
                color: "red",
                marginBottom: 4,
                textAlign: "center",
                fontSize: 15,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px 0",
              background: "linear-gradient(90deg, #2563eb 60%, #1e40af 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              marginTop: 10,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(30,64,175,0.08)",
              transition: "background 0.2s, transform 0.1s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#1e40af")}
            onMouseOut={(e) =>
              (e.currentTarget.style.background =
                "linear-gradient(90deg, #2563eb 60%, #1e40af 100%)")
            }
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
