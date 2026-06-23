import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { loginApi, updateProfileApi } from "../api/auth";
import type { LoginResponse, UpdateProfileRequest } from "../api/auth";

interface AuthContextType {
  user: string | null;
  userName: string | null;
  userId: number | null;
  role: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  forceLogout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  handleApiError: (response: Response) => boolean;
  pingToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Chaves para localStorage
const AUTH_TOKEN_KEY = "auth_token";
const AUTH_REFRESH_TOKEN_KEY = "auth_refresh_token";
const AUTH_USER_KEY = "auth_user";
const AUTH_USERNAME_KEY = "auth_username";
const AUTH_USERID_KEY = "auth_userid";
const AUTH_ROLE_KEY = "auth_role";
const LOGOUT_REASON_KEY = "logout_reason";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Começa como true para carregar dados
  const [error, setError] = useState<string | null>(null);

  // Função para forçar logout (usada quando token é inválido)
  const forceLogout = (reason = "expired") => {
    setUser(null);
    setUserName(null);
    setUserId(null);
    setRole(null);
    setToken(null);
    clearAuthData();
    localStorage.setItem(LOGOUT_REASON_KEY, reason);
    if (window.location.pathname !== "/") {
      window.location.href = "/?reason=" + reason;
    }
  };

  // Renova o access token usando o refresh token salvo no localStorage
  const tryRefreshToken = async (): Promise<string | null> => {
    const savedRefreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    if (!savedRefreshToken) return null;
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const resp = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: savedRefreshToken }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const newToken: string = data.token;
      setToken(newToken);
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      return newToken;
    } catch {
      return null;
    }
  };

  // Verifica o token atual; tenta renovar automaticamente se expirado
  const pingToken = async (): Promise<boolean> => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) {
      forceLogout("expired");
      return false;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const resp = await fetch(`${API_URL}/auth/ping`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (resp.ok) return true;
      if (resp.status === 401) {
        // Token expirado — tenta renovar
        const newToken = await tryRefreshToken();
        if (newToken) return true;
        forceLogout("expired");
        return false;
      }
      return true;
    } catch {
      // Erro de rede — não forçar logout, pode ser instabilidade temporária
      return true;
    }
  };

  // Função para verificar se o token existe e é válido
  const checkTokenValidity = () => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    const savedUsername = localStorage.getItem(AUTH_USERNAME_KEY);
    const savedUserId = localStorage.getItem(AUTH_USERID_KEY);
    const savedRole = localStorage.getItem(AUTH_ROLE_KEY);

    // Se algum dado estiver faltando, forçar logout
    if (
      !savedToken ||
      !savedUser ||
      !savedUsername ||
      !savedUserId ||
      !savedRole
    ) {
      forceLogout();
      return false;
    }

    // Verificar se o token não está vazio
    if (savedToken.trim() === "") {
      forceLogout();
      return false;
    }

    return true;
  };

  // Função para tratar erros de API (especialmente 401)
  const handleApiError = (response: Response): boolean => {
    if (response.status === 401) {
      console.warn("Erro 401 detectado. Token expirado ou inválido.");
      forceLogout();
      return true; // Indica que o erro foi tratado
    }
    return false; // Indica que o erro não foi tratado
  };

  // Carregar dados do localStorage na inicialização E pingar backend
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    const savedUsername = localStorage.getItem(AUTH_USERNAME_KEY);
    const savedUserId = localStorage.getItem(AUTH_USERID_KEY);
    const savedRole = localStorage.getItem(AUTH_ROLE_KEY);
    const savedRefreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    if (
      savedToken &&
      savedUser &&
      savedUsername &&
      savedUserId &&
      savedRole &&
      savedToken.trim() !== ""
    ) {
      setToken(savedToken);
      setUser(savedUser);
      setUserName(savedUsername);
      setUserId(Number(savedUserId));
      setRole(savedRole);
      setLoading(false);
      // Valida o token diretamente com o valor do localStorage, sem depender
      // do estado React (que ainda não foi commitado no momento do useEffect)
      const API_URL = import.meta.env.VITE_API_URL;
      fetch(`${API_URL}/auth/ping`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(async (resp) => {
          if (resp.status === 401) {
            // Tenta renovar com refresh token antes de forçar logout
            if (savedRefreshToken) {
              const refreshResp = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: savedRefreshToken }),
              });
              if (refreshResp.ok) {
                const data = await refreshResp.json();
                setToken(data.token);
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                return;
              }
            }
            forceLogout("expired");
          }
        })
        .catch(() => {
          // Erro de rede na verificação inicial — não deslogar
        });
    } else {
      setLoading(false);
      if (window.location.pathname !== "/") {
        forceLogout("expired");
      }
    }
  }, []);

  // Verificar token periodicamente (a cada 5 minutos)
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        if (!checkTokenValidity()) {
          clearInterval(interval);
        }
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [token]);

  // Função para salvar dados no localStorage
  const saveAuthData = (authData: {
    token: string;
    refreshToken?: string;
    nome: string;
    username: string;
    userId: number;
    role: string;
  }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
    if (authData.refreshToken) {
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, authData.refreshToken);
    }
    localStorage.setItem(AUTH_USER_KEY, authData.nome);
    localStorage.setItem(AUTH_USERNAME_KEY, authData.username);
    localStorage.setItem(AUTH_USERID_KEY, authData.userId.toString());
    localStorage.setItem(AUTH_ROLE_KEY, authData.role);
  };

  // Função para limpar dados do localStorage
  const clearAuthData = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_USERID_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res: LoginResponse = await loginApi(username, password);
      setUser(res.nome);
      setUserName(res.username);
      setUserId(res.userId);
      setRole(res.role);
      setToken(res.token);

      // Salvar no localStorage (incluindo refreshToken)
      saveAuthData({
        token: res.token,
        refreshToken: res.refreshToken,
        nome: res.nome,
        username: res.username,
        userId: res.userId,
        role: res.role,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao autenticar");
      setUser(null);
      setUserName(null);
      setUserId(null);
      setRole(null);
      setToken(null);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUserName(null);
    setUserId(null);
    setRole(null);
    setToken(null);
    clearAuthData();
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    if (!userId || !token) {
      throw new Error("Usuário não autenticado");
    }

    setLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfileApi(userId, data, token);
      setUser(updatedUser.nome);
      setUserName(updatedUser.username);

      // Atualizar localStorage com novos dados
      if (data.nome) {
        localStorage.setItem(AUTH_USER_KEY, updatedUser.nome);
      }
      if (data.password) {
        // Se a senha foi alterada, não precisamos atualizar o localStorage
        // pois o token continua o mesmo
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar perfil");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userName,
        userId,
        role,
        token,
        loading,
        error,
        login,
        logout,
        forceLogout,
        updateProfile,
        handleApiError,
        pingToken, // <-- agora exportado!
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
