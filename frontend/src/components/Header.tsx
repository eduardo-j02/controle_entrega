import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Header: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const userInitial = user ? user.charAt(0).toUpperCase() : "?";

  return (
    <header
      style={{
        width: "100%",
        height: 64,
        background: "#1e293b",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(30,41,59,0.08)",
        zIndex: 100,
        justifyContent: "space-between",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          marginLeft: 32,
        }}
      >
        <img
          src={logo}
          alt="Logo Polar Entregas"
          style={{ height: 72, marginRight: 28, background: "none" }}
        />
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 1,
          }}
        >
          Polar Entregas
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: 17,
            color: "#2563eb",
            marginRight: 0,
          }}
        >
          {user}
        </span>
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "#e0e7ff",
              border: "none",
              borderRadius: "50%",
              width: 42,
              height: 42,
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: menuOpen ? "0 0 0 2px #2563eb" : undefined,
              transition: "box-shadow 0.2s",
              fontWeight: 700,
              color: "#2563eb",
              marginRight: 30,
            }}
            aria-label="Menu do usuário"
          >
            {userInitial}
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 54,
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 4px 16px rgba(30,64,175,0.13)",
                minWidth: 170,
                padding: "8px 0",
                zIndex: 200,
                border: "1.5px solid #e0e7ff",
              }}
            >
              <button
                style={menuItemStyle}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/alterar-perfil");
                }}
              >
                Alterar perfil
              </button>
              <button
                style={menuItemStyle}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/alterar-senha");
                }}
              >
                Alterar senha
              </button>
              <button
                style={{ ...menuItemStyle, color: "#dc2626" }}
                onClick={onLogout}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  background: "none",
  border: "none",
  padding: "11px 20px",
  textAlign: "left",
  fontSize: 16,
  color: "#222",
  cursor: "pointer",
  fontWeight: 500,
  transition: "background 0.15s",
  borderRadius: 7,
  outline: "none",
  margin: 0,
  display: "block",
};

export default Header;
