import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Rotas", path: "/rotas", icon: "🛣️" },
    { label: "Roteirizador", path: "/roteirizador", icon: "🗺️" },
    { label: "Entregas", path: "/entregas", icon: "📦" },
    { label: "Ocorrências", path: "/ocorrencias", icon: "⚠️" },
    // Mostrar "Usuários" apenas para ADMIN/SUPERADMIN
    ...(role === "ADMIN" || role === "SUPERADMIN"
      ? [{ label: "Usuários", path: "/usuarios", icon: "👥" }]
      : []),
  ];

  return (
    <aside
      style={{
        width: 210,
        height: "100vh",
        background: "linear-gradient(120deg, #e0e7ff 0%, #f7f8fa 100%)",
        borderRight: "1.5px solid #e0e7ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9,
        boxShadow: "2px 0 8px rgba(30,64,175,0.04)",
        minWidth: 210,
        transition: "all 0.2s",
        paddingBottom: 24,
        marginTop: 64,
        ...(window.innerWidth < 600 ? { display: "none" } : {}),
      }}
    >
      <div style={{ marginTop: 18 }}>
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 24px",
                background: active ? "rgba(37,99,235,0.13)" : "none",
                color: active ? "#2563eb" : "#222",
                border: "none",
                borderLeft: active
                  ? "4px solid #2563eb"
                  : "4px solid transparent",
                fontWeight: active ? 700 : 500,
                fontSize: 17,
                cursor: "pointer",
                outline: "none",
                transition: "background 0.18s, color 0.18s",
                marginBottom: 2,
                borderRadius: 7,
                position: "relative",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(37,99,235,0.08) ")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = active
                  ? "rgba(37,99,235,0.13)"
                  : "none")
              }
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
