import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";

import Constants from "expo-constants";

const API_URL = "http://192.168.0.205:3333";

export async function login(username: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      let err;
      try {
        err = await response.json();
      } catch (e) {
        err = { error: "Erro desconhecido", details: e };
      }
      throw new Error(err.error || "Erro ao fazer login");
    }
    const data = await response.json();
    await SecureStore.setItemAsync("token", data.token);
    await SecureStore.setItemAsync("userId", String(data.userId));
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getToken() {
  return SecureStore.getItemAsync("token");
}

export async function logout() {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("userId");
}

export async function getMinhasEntregas() {
  const token = await getToken();
  const response = await fetch(`${API_URL}/entregas/minhas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erro ao buscar entregas");
  }
  return response.json();
}

export async function buscarNotaPorChave(chaveNfe: string) {
  const token = await getToken();
  const response = await fetch(`${API_URL}/notas/chave/${chaveNfe}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const err = await response.json();
    throw new Error(err.error || "Erro ao buscar nota");
  }
  return response.json();
}

export async function criarEntrega({ notaId }: { notaId: number }) {
  const token = await getToken();
  const dataEntrega = new Date().toISOString();
  const formData = new FormData();
  formData.append("notaId", String(notaId));
  formData.append("dataEntrega", dataEntrega);
  // Não envia comprovante, latitude, longitude neste fluxo
  const response = await fetch(`${API_URL}/entregas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erro ao criar entrega");
  }
  return response.json();
}

export async function finalizarEntrega({
  entregaId,
  comprovanteUri,
  latitude,
  longitude,
  nomeRecebedor,
  assinaturaRecebedor,
  ocorrenciaDescricao,
  ocorrenciaFotos,
}: {
  entregaId: number;
  comprovanteUri: string;
  latitude?: number;
  longitude?: number;
  nomeRecebedor: string;
  assinaturaRecebedor?: string;
  ocorrenciaDescricao?: string;
  ocorrenciaFotos?: string[];
}) {
  const token = await getToken();
  const formData = new FormData();
  formData.append("comprovante", {
    uri: comprovanteUri,
    name: comprovanteUri.split("/").pop() || "comprovante.jpg",
    type: "image/jpeg", // ajuste conforme o tipo real
  } as any);
  if (latitude !== undefined) formData.append("latitude", String(latitude));
  if (longitude !== undefined) formData.append("longitude", String(longitude));
  formData.append("nomeRecebedor", nomeRecebedor);
  if (assinaturaRecebedor)
    formData.append("assinaturaRecebedor", assinaturaRecebedor);
  // Adiciona ocorrência se houver
  if (ocorrenciaDescricao) {
    formData.append("ocorrenciaDescricao", ocorrenciaDescricao);
  }
  if (ocorrenciaFotos && ocorrenciaFotos.length > 0) {
    ocorrenciaFotos.forEach((uri, idx) => {
      formData.append(`ocorrenciaFoto${idx + 1}`, {
        uri,
        name: uri.split("/").pop() || `ocorrencia${idx + 1}.jpg`,
        type: "image/jpeg",
      } as any);
    });
  }
  // DEBUG: logar formData antes do envio

  try {
    const response = await fetch(`${API_URL}/entregas/${entregaId}/finalizar`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();

      throw new Error(err.error || "Erro ao finalizar entrega");
    }
    const data = await response.json();

    return data;
  } catch (e) {
    throw e;
  }
}

export async function baixarPdfNota(notaId: number, nomeArquivo: string) {
  const token = await getToken();
  const url = `${API_URL}/notas/${notaId}/pdf`;
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    FileSystem.documentDirectory + nomeArquivo,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const result = await downloadResumable.downloadAsync();
  if (!result) throw new Error("Falha ao baixar PDF");
  return result.uri;
}

export async function transferirRedespacho(
  entregaId: number,
  latitude?: number,
  longitude?: number
) {
  const token = await getToken();
  const body: any = {};
  if (latitude !== undefined) body.latitude = latitude;
  if (longitude !== undefined) body.longitude = longitude;
  const response = await fetch(
    `${API_URL}/entregas/${entregaId}/transferir-redespacho`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erro ao transferir redespacho");
  }
  return response.json();
}
