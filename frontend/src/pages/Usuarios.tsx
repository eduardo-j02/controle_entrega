import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  nome: string;
  role: string;
  createdAt: string;
}

const Usuarios: React.FC = () => {
  const { token, user: currentUser, pingToken, forceLogout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Estados para criação/edição
  const [formData, setFormData] = useState({
    username: "",
    nome: "",
    password: "",
    role: "USER",
  });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    (async () => {
      if (typeof pingToken === "function") {
        const ok = await pingToken();
        if (!ok) {
          forceLogout();
          return;
        }
      }
      fetchUsers();
    })();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError(
            "Acesso negado. Apenas administradores podem acessar esta página."
          );
        } else {
          setError("Erro ao carregar usuários");
        }
        return;
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.nome || !formData.password) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao criar usuário");
        return;
      }

      setShowCreateModal(false);
      setFormData({ username: "", nome: "", password: "", role: "USER" });
      fetchUsers();
    } catch (err) {
      setError("Erro ao criar usuário");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData: any = { nome: formData.nome, role: formData.role };
      if (formData.password) updateData.password = formData.password;

      const response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao atualizar usuário");
        return;
      }

      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ username: "", nome: "", password: "", role: "USER" });
      fetchUsers();
    } catch (err) {
      setError("Erro ao atualizar usuário");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao excluir usuário");
        return;
      }

      fetchUsers();
    } catch (err) {
      setError("Erro ao excluir usuário");
    }
  };

  const openCreateModal = () => {
    setFormData({ username: "", nome: "", password: "", role: "ADMIN" });
    setShowCreateModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setFormData({ username: "", nome: "", password: "", role: "ADMIN" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 18, color: "#2563eb" }}>
            Carregando usuários...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ color: "#dc2626", marginBottom: 16 }}>{error}</div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{ color: "#2563eb", fontSize: "28px", fontWeight: "bold" }}
          >
            Gerenciar Usuários
          </h1>
          <button
            onClick={openCreateModal}
            style={{
              padding: "12px 24px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            + Novo Usuário
          </button>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Nome
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Usuário
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Perfil
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Data Criação
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", color: "#374151" }}>
                    {user.nome}
                  </td>
                  <td style={{ padding: "16px", color: "#6b7280" }}>
                    {user.username}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          user.role === "SUPERADMIN"
                            ? "#ede9fe"
                            : user.role === "ADMIN"
                            ? "#fef3c7"
                            : user.role === "GESTOR"
                            ? "#d1fae5"
                            : "#dbeafe",
                        color:
                          user.role === "SUPERADMIN"
                            ? "#7c3aed"
                            : user.role === "ADMIN"
                            ? "#92400e"
                            : user.role === "GESTOR"
                            ? "#047857"
                            : "#1e40af",
                        border:
                          user.role === "SUPERADMIN"
                            ? "1.5px solid #7c3aed"
                            : undefined,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {user.role === "SUPERADMIN"
                        ? "SUPERADMIN"
                        : user.role === "ADMIN"
                        ? "ADMIN"
                        : user.role === "GESTOR"
                        ? "GESTOR"
                        : "MOTORISTA"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#6b7280" }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({
                            username: user.username,
                            nome: user.nome,
                            password: "",
                            role: user.role,
                          });
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Editar
                      </button>
                      {user.role !== "SUPERADMIN" &&
                        user.username !== currentUser && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              padding: "6px 12px",
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            Excluir
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de Criação */}
        {showCreateModal && (
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
                padding: "24px",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "400px",
                minWidth: "0",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <h2 style={{ marginBottom: "20px", color: "#2563eb" }}>
                Novo Usuário
              </h2>
              <form onSubmit={handleCreateUser}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                    required
                    autoComplete="username"
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Perfil
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="GESTOR">Gestor</option>
                    <option value="MOTORISTA">Motorista</option>
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      padding: "8px 16px",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {showEditModal && selectedUser && (
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
                padding: "24px",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "400px",
                minWidth: "0",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <h2 style={{ marginBottom: "20px", color: "#2563eb" }}>
                Editar Usuário
              </h2>
              <form onSubmit={handleEditUser}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      background: "#f3f4f6",
                      color: "#6b7280",
                      boxSizing: "border-box",
                    }}
                    autoComplete="username"
                  />
                  <small style={{ color: "#6b7280", fontSize: "12px" }}>
                    O nome de usuário não pode ser alterado
                  </small>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Nova Senha (opcional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Deixe em branco para manter a senha atual"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                    autoComplete="new-password"
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Perfil
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="GESTOR">Gestor</option>
                    <option value="MOTORISTA">Motorista</option>
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={closeEditModal}
                    style={{
                      padding: "8px 16px",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Usuarios;
