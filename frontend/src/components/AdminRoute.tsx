import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { token, loading, role, forceLogout } = useAuth();

  // Verificar token quando o componente montar
  useEffect(() => {
    if (!loading && !token) {
      // Se não há token e não está carregando, verificar localStorage
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");
      const savedUsername = localStorage.getItem("auth_username");
      const savedUserId = localStorage.getItem("auth_userid");
      const savedRole = localStorage.getItem("auth_role");

      // Se algum dado estiver faltando ou token vazio, forçar logout
      if (
        !savedToken ||
        !savedUser ||
        !savedUsername ||
        !savedUserId ||
        !savedRole ||
        savedToken.trim() === ""
      ) {
        forceLogout();
      }
    }
  }, [token, loading, forceLogout]);

  if (loading) {
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

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Verificar se é ADMIN
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
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
            textAlign: "center",
            color: "#dc2626",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Acesso negado. Apenas administradores podem acessar esta página.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
