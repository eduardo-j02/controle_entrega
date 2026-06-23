import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // Ajuste se necessário

export interface LoginResponse {
  token: string;
  refreshToken: string;
  nome: string;
  username: string;
  role: string;
  userId: number;
}

export interface UpdateProfileRequest {
  nome?: string;
  password?: string;
}

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para detectar erros 401 e forçar logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expirado ou inválido. Forçando logout...");
      // Limpar localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_username");
      localStorage.removeItem("auth_userid");
      localStorage.removeItem("auth_role");

      // Redirecionar para login se não estiver na página de login
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export async function loginApi(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post(`/auth/login`, {
    username,
    password,
  });
  return response.data;
}

export async function updateProfileApi(
  userId: number,
  data: UpdateProfileRequest,
  token: string
) {
  const response = await api.put(`/users/${userId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function changePasswordApi(
  userId: number,
  data: { senhaAtual: string; novaSenha: string },
  token: string
) {
  const response = await api.patch(`/users/${userId}/senha`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Exportar a instância do axios para uso em outros arquivos
export { api };
