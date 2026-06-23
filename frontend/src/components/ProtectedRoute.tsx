import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN", "GESTOR"];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, loading, role, logout } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Verificar token e role quando o componente montar
  useEffect(() => {
    if (!loading && (!token || !ALLOWED_ROLES.includes(role || ""))) {
      setShowAlert(true);
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          logout(); // Limpa o contexto
          navigate("/", { replace: true }); // Redireciona para login
        }, 2000);
      }
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [token, loading, role, logout, navigate]);

  if (loading) {
    // Mostrar loading enquanto verifica autenticação
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
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

  if (showAlert) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: "rgba(30, 64, 175, 0.10)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #dc2626",
            color: "#dc2626",
            borderRadius: 10,
            padding: "32px 40px",
            fontSize: 20,
            fontWeight: 600,
            boxShadow: "0 2px 16px #0002",
            marginBottom: 16,
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          Acesso negado!
          <br />
          Você não tem permissão para acessar este sistema.
        </div>
        <div style={{ color: "#374151", fontSize: 16 }}>
          Você será redirecionado para o login em instantes...
        </div>
      </div>
    );
  }

  if (!token || !ALLOWED_ROLES.includes(role || "")) {
    // Não renderiza nada enquanto alerta está ativo
    return null;
  }

  // Renderizar o conteúdo se estiver autenticado e autorizado
  return <>{children}</>;
};

export default ProtectedRoute;
