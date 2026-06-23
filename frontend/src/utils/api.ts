import { useAuth } from "../context/AuthContext";

// Função utilitária para fazer requisições fetch com tratamento de erro 401
export const apiFetch = async (
  url: string,
  options: RequestInit = {},
  forceLogout?: () => void
): Promise<Response> => {
  const response = await fetch(url, options);

  // Se receber erro 401, forçar logout
  if (response.status === 401) {
    console.warn("Erro 401 detectado em apiFetch. Forçando logout...");
    if (forceLogout) {
      forceLogout();
    } else {
      // Limpar localStorage e redirecionar
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_username");
      localStorage.removeItem("auth_userid");
      localStorage.removeItem("auth_role");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
  }

  return response;
};

// Função para fazer download de arquivos com autenticação
export const downloadFile = async (
  url: string,
  filename: string,
  token: string,
  forceLogout?: () => void
): Promise<void> => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // Garante envio/aceite de cookies e CORS
    });

    if (response.status === 401) {
      console.warn("Erro 401 detectado no download. Forçando logout...");
      if (forceLogout) {
        forceLogout();
      } else {
        // Limpar localStorage e redirecionar
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_refresh_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_username");
        localStorage.removeItem("auth_userid");
        localStorage.removeItem("auth_role");

        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
      return;
    }

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status}`);
    }

    // Obter o blob da resposta
    const blob = await response.blob();

    // Criar URL do blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Criar elemento de link temporário
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;

    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar URL do blob
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Erro ao fazer download:", error);
    throw error;
  }
};

// Hook personalizado para usar apiFetch com contexto de auth
export const useApiFetch = () => {
  const { forceLogout, token } = useAuth();

  return {
    fetch: (url: string, options: RequestInit = {}) =>
      apiFetch(url, options, forceLogout),
    downloadFile: (url: string, filename: string) =>
      downloadFile(url, filename, token || "", forceLogout),
  };
};
