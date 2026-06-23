import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Button,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import {
  getMinhasEntregas,
  finalizarEntrega,
  baixarPdfNota,
  transferirRedespacho,
} from "../services/api";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";

type MotoristaRedespacho = {
  id: number;
  nome: string;
  ordem: number;
  dataTransferencia?: string | null;
};
type Entrega = {
  id: number;
  chaveNfe: string;
  numero?: string;
  cliente?: string;
  dataEmissao?: string;
  status: string;
  dataFinalizacao?: string;
  redespacho?: boolean;
  motoristas?: MotoristaRedespacho[];
};

export default function MinhasEntregasScreen() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  const [permissoesOk, setPermissoesOk] = useState(false);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [nomeRecebedor, setNomeRecebedor] = useState("");
  const [assinaturaRecebedor, setAssinaturaRecebedor] = useState<
    string | undefined
  >(undefined);
  const [comprovanteUri, setComprovanteUri] = useState<string | undefined>(
    undefined
  );
  const [finalizandoEntregaId, setFinalizandoEntregaId] = useState<
    number | null
  >(null);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [transferindoId, setTransferindoId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [modalOcorrenciaPergunta, setModalOcorrenciaPergunta] = useState(false);
  const [dadosFinalizacaoTemp, setDadosFinalizacaoTemp] = useState<any>(null); // Guarda dados da finalização até decidir ocorrência
  const [modalOcorrencia, setModalOcorrencia] = useState(false);
  const [descricaoOcorrencia, setDescricaoOcorrencia] = useState("");
  const [fotosOcorrencia, setFotosOcorrencia] = useState<string[]>([]);
  const [finalizandoOcorrencia, setFinalizandoOcorrencia] = useState(false);
  useEffect(() => {
    SecureStore.getItemAsync("userId").then((id) =>
      setUserId(id ? Number(id) : null)
    );
  }, []);

  async function carregarEntregas() {
    setErro("");
    try {
      setLoading(true);
      const data = await getMinhasEntregas();
      setEntregas(data);
    } catch (err: any) {
      setErro(err.message || "Erro ao buscar entregas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { status: locStatus } =
        await Location.requestForegroundPermissionsAsync();
      const { status: camStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: galStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPermissoesOk(
        locStatus === "granted" &&
          camStatus === "granted" &&
          galStatus === "granted"
      );
    })();
  }, []);

  async function abrirModalFinalizar(
    entregaId: number,
    uri: string,
    lat?: number,
    long?: number
  ) {
    setFinalizandoEntregaId(entregaId);
    setComprovanteUri(uri);
    setLatitude(lat);
    setLongitude(long);
    setNomeRecebedor("");
    setAssinaturaRecebedor(undefined);
    setModalFinalizar(true);
  }

  async function handleFinalizarEntrega() {
    if (!finalizandoEntregaId || !comprovanteUri || !nomeRecebedor.trim()) {
      alert("Preencha o nome do recebedor e anexe o comprovante.");
      return;
    }
    try {
      setFinalizandoId(finalizandoEntregaId);
      await finalizarEntrega({
        entregaId: finalizandoEntregaId,
        comprovanteUri,
        latitude,
        longitude,
        nomeRecebedor,
      });
      alert("Entrega finalizada com sucesso!");
      setModalFinalizar(false);
      carregarEntregas();
    } catch (err: any) {
      alert(err.message || "Erro ao finalizar entrega");
    } finally {
      setFinalizandoId(null);
    }
  }

  // NOVO: Função chamada após tirar/selecionar foto, antes de abrir modal de finalização
  function perguntarOcorrenciaAntesFinalizar(
    entregaId: number,
    uri: string,
    lat?: number,
    long?: number
  ) {
    setDadosFinalizacaoTemp({ entregaId, uri, lat, long });
    setModalOcorrenciaPergunta(true);
  }

  // Atualizar finalizarComCamera e finalizarComGaleria para usar a nova função
  async function finalizarComCamera(entregaId: number) {
    try {
      setFinalizandoId(entregaId);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        setFinalizandoId(null);
        return;
      }
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      const comprovanteUri = manipResult.uri;
      let latitude = undefined;
      let longitude = undefined;
      try {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      } catch (e) {
        alert("Não foi possível obter a localização. Permita o acesso ao GPS.");
      }
      perguntarOcorrenciaAntesFinalizar(
        entregaId,
        comprovanteUri,
        latitude,
        longitude
      );
    } catch (err: any) {
      alert(err.message || "Erro ao capturar foto");
      setFinalizandoId(null);
    }
  }

  async function finalizarComGaleria(entregaId: number) {
    try {
      setFinalizandoId(entregaId);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        setFinalizandoId(null);
        return;
      }
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      const comprovanteUri = manipResult.uri;
      let latitude = undefined;
      let longitude = undefined;
      try {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      } catch (e) {
        alert("Não foi possível obter a localização. Permita o acesso ao GPS.");
      }
      perguntarOcorrenciaAntesFinalizar(
        entregaId,
        comprovanteUri,
        latitude,
        longitude
      );
    } catch (err: any) {
      alert(err.message || "Erro ao selecionar foto");
      setFinalizandoId(null);
    }
  }

  // NOVO: Handler para resposta do modal de ocorrência
  function handleRespostaOcorrencia(houveOcorrencia: boolean) {
    setModalOcorrenciaPergunta(false);
    if (!dadosFinalizacaoTemp) return;
    if (houveOcorrencia) {
      setModalOcorrencia(true);
    } else {
      abrirModalFinalizar(
        dadosFinalizacaoTemp.entregaId,
        dadosFinalizacaoTemp.uri,
        dadosFinalizacaoTemp.lat,
        dadosFinalizacaoTemp.long
      );
      setDadosFinalizacaoTemp(null);
    }
  }

  // Função para adicionar foto à ocorrência
  async function adicionarFotoOcorrencia(tipo: "camera" | "galeria") {
    try {
      let result;
      if (tipo === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          allowsEditing: true,
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: true,
          quality: 0.7,
        });
      }
      if (result.canceled || !result.assets || !result.assets[0]?.uri) return;
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      setFotosOcorrencia((prev) => [...prev, manipResult.uri]);
    } catch (err: any) {
      alert(err.message || "Erro ao adicionar foto");
    }
  }

  // Função para remover foto da ocorrência
  function removerFotoOcorrencia(idx: number) {
    setFotosOcorrencia((prev) => prev.filter((_, i) => i !== idx));
  }

  // Função para enviar ocorrência e finalizar entrega
  async function handleEnviarOcorrencia() {
    if (!descricaoOcorrencia.trim()) {
      alert("Descreva a ocorrência.");
      return;
    }
    if (!dadosFinalizacaoTemp) return;
    setFinalizandoOcorrencia(true);
    try {
      // Monta objeto para passar para finalizarEntrega
      const params: any = {
        entregaId: dadosFinalizacaoTemp.entregaId,
        comprovanteUri: dadosFinalizacaoTemp.uri,
        latitude: dadosFinalizacaoTemp.lat,
        longitude: dadosFinalizacaoTemp.long,
        nomeRecebedor,
        assinaturaRecebedor,
        ocorrenciaDescricao: descricaoOcorrencia,
        ocorrenciaFotos: fotosOcorrencia,
      };
      await finalizarEntrega(params);
      alert("Entrega finalizada com ocorrência!");
      setModalOcorrencia(false);
      setDescricaoOcorrencia("");
      setFotosOcorrencia([]);
      setDadosFinalizacaoTemp(null);
      setNomeRecebedor("");
      setAssinaturaRecebedor(undefined);
      carregarEntregas();
    } catch (err: any) {
      alert(err.message || "Erro ao finalizar entrega com ocorrência");
    } finally {
      setFinalizandoOcorrencia(false);
    }
  }

  // Fechar modal de ocorrência
  function handleCancelarOcorrencia() {
    setModalOcorrencia(false);
    setDescricaoOcorrencia("");
    setFotosOcorrencia([]);
    setDadosFinalizacaoTemp(null);
  }

  async function handleBaixarPdf(entrega: Entrega) {
    try {
      if (!entrega.id || !entrega.numero)
        throw new Error("Dados da nota incompletos");
      const nomeArquivo = `danfe_nota_${entrega.numero}.pdf`;
      const uri = await baixarPdfNota(entrega.id, nomeArquivo);
      await Sharing.shareAsync(uri);
    } catch (err: any) {
      alert(err.message || "Erro ao baixar PDF");
    }
  }

  useEffect(() => {
    carregarEntregas();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Entregas</Text>
      {erro ? (
        <Text style={{ color: "red", marginBottom: 12 }}>{erro}</Text>
      ) : null}
      <FlatList
        data={entregas}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarEntregas();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={{ color: "#6b7280", marginTop: 16 }}>
            Nenhuma entrega encontrada.
          </Text>
        }
        renderItem={({ item }) => {
          // Lógica para identificar se é redespacho e se o usuário é o motorista atual
          let podeTransferir = false;
          let proximoMotorista = null;
          let historicoMotoristas = null;
          if (
            item.redespacho &&
            Array.isArray(item.motoristas) &&
            item.motoristas.length > 0
          ) {
            // Descobre o motorista atual (menor ordem sem dataTransferencia)
            const idxAtual = item.motoristas.findIndex(
              (m) => !m.dataTransferencia
            );
            const motoristaAtual =
              idxAtual >= 0 ? item.motoristas[idxAtual] : null;
            podeTransferir =
              !!motoristaAtual &&
              userId === motoristaAtual.id &&
              item.status !== "Entregue";
            proximoMotorista = item.motoristas[idxAtual + 1] || null;
            historicoMotoristas = (
              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <Text style={{ fontWeight: "bold", color: "#2563eb" }}>
                  Redespacho:
                </Text>
                {item.motoristas.map((m, idx) => (
                  <Text
                    key={m.id}
                    style={{ color: idx === idxAtual ? "#2563eb" : "#374151" }}
                  >
                    {m.nome}{" "}
                    {idx === idxAtual
                      ? "(Atual)"
                      : m.dataTransferencia
                      ? "(Transferiu)"
                      : ""}
                  </Text>
                ))}
              </View>
            );
          }
          // Lógica para exibir botão de finalização para quem estiver com a entrega
          let podeFinalizar = false;
          if (item.status === "Pendente") {
            if (
              item.redespacho &&
              Array.isArray(item.motoristas) &&
              item.motoristas.length > 0 &&
              userId
            ) {
              // Motorista atual do redespacho (menor ordem sem dataTransferencia)
              const idxAtual = item.motoristas.findIndex(
                (m) => !m.dataTransferencia
              );
              const motoristaAtual =
                idxAtual >= 0 ? item.motoristas[idxAtual] : null;
              if (
                motoristaAtual &&
                motoristaAtual.id === userId &&
                !item.dataFinalizacao
              ) {
                podeFinalizar = true;
              }
            } else if (
              !item.redespacho &&
              userId &&
              item.motoristas &&
              item.motoristas.length > 0
            ) {
              // Entrega simples: motorista principal
              if (item.motoristas[0].id === userId && !item.dataFinalizacao) {
                podeFinalizar = true;
              }
            }
          }
          return (
            <View style={styles.card}>
              <Text style={styles.label}>Chave NFe:</Text>
              <Text style={styles.value}>{item.chaveNfe || "-"}</Text>
              <Text style={styles.label}>Número NF:</Text>
              <Text style={styles.value}>{item.numero || "-"}</Text>
              <Text style={styles.label}>Cliente:</Text>
              <Text style={styles.value}>{item.cliente || "-"}</Text>
              <Text style={styles.label}>Data de Emissão:</Text>
              <Text style={styles.value}>
                {item.dataEmissao
                  ? new Date(item.dataEmissao).toLocaleString()
                  : "-"}
              </Text>
              {item.dataFinalizacao && (
                <>
                  <Text style={styles.label}>Data de Finalização:</Text>
                  <Text style={styles.value}>
                    {new Date(item.dataFinalizacao).toLocaleString()}
                  </Text>
                </>
              )}
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{item.status}</Text>
              {podeFinalizar && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: "#f59e42", marginBottom: 4 }}>
                    Anexe o comprovante para finalizar:
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Button
                      title="Tirar Foto"
                      onPress={() => finalizarComCamera(item.id)}
                      disabled={finalizandoId === item.id}
                    />
                    <Button
                      title="Selecionar da Galeria"
                      onPress={() => finalizarComGaleria(item.id)}
                      disabled={finalizandoId === item.id}
                    />
                  </View>
                  {finalizandoId === item.id && (
                    <ActivityIndicator
                      size="small"
                      color="#2563eb"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </View>
              )}
              {historicoMotoristas}
              {podeTransferir && (
                <View style={{ marginTop: 8 }}>
                  <Button
                    title={
                      transferindoId === item.id
                        ? "Transferindo..."
                        : `Transferir para o próximo motorista${
                            proximoMotorista ? `: ${proximoMotorista.nome}` : ""
                          }`
                    }
                    onPress={async () => {
                      setTransferindoId(item.id);
                      let latitude, longitude;
                      try {
                        const location = await Location.getCurrentPositionAsync(
                          {}
                        );
                        latitude = location.coords.latitude;
                        longitude = location.coords.longitude;
                      } catch (e) {
                        // localização opcional
                      }
                      try {
                        await transferirRedespacho(
                          item.id,
                          latitude,
                          longitude
                        );
                        alert("Transferência realizada com sucesso!");
                        carregarEntregas();
                      } catch (err: any) {
                        alert(err.message || "Erro ao transferir redespacho");
                      } finally {
                        setTransferindoId(null);
                      }
                    }}
                    disabled={transferindoId === item.id}
                    color="#2563eb"
                  />
                </View>
              )}
              <View style={{ marginTop: 8 }}>
                <Button
                  title="Baixar DANFE (PDF)"
                  onPress={() => handleBaixarPdf(item)}
                />
              </View>
            </View>
          );
        }}
      />
      {/* Modal de Finalização */}
      <Modal visible={modalFinalizar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finalizar Entrega</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do Recebedor"
              value={nomeRecebedor}
              onChangeText={(text) => setNomeRecebedor(text)}
              autoCapitalize="words"
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Button
                title="Finalizar"
                onPress={handleFinalizarEntrega}
                disabled={!nomeRecebedor || nomeRecebedor.trim().length === 0}
              />
              <Button
                title="Cancelar"
                color="#ef4444"
                onPress={() => setModalFinalizar(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal de Pergunta de Ocorrência */}
      <Modal visible={modalOcorrenciaPergunta} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Houve alguma ocorrência nesta entrega?
            </Text>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 24 }}>
              <Button
                title="Sim"
                onPress={() => handleRespostaOcorrencia(true)}
              />
              <Button
                title="Não"
                onPress={() => handleRespostaOcorrencia(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal de Ocorrência */}
      <Modal visible={modalOcorrencia} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Descreva a Ocorrência</Text>
            <TextInput
              style={[
                styles.input,
                { minHeight: 80, textAlignVertical: "top" },
              ]}
              placeholder="Descreva o que aconteceu..."
              value={descricaoOcorrencia}
              onChangeText={setDescricaoOcorrencia}
              multiline
              numberOfLines={4}
            />
            <View style={{ flexDirection: "row", gap: 12, marginVertical: 8 }}>
              <Button
                title="Tirar Foto"
                onPress={() => adicionarFotoOcorrencia("camera")}
              />
              <Button
                title="Galeria"
                onPress={() => adicionarFotoOcorrencia("galeria")}
              />
            </View>
            <ScrollView
              horizontal
              style={{ marginVertical: 8, maxHeight: 100 }}
            >
              {fotosOcorrencia.map((uri, idx) => (
                <View
                  key={uri}
                  style={{ marginRight: 8, position: "relative" }}
                >
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      zIndex: 2,
                      backgroundColor: "#ef4444",
                      borderRadius: 10,
                    }}
                    onPress={() => removerFotoOcorrencia(idx)}
                  >
                    <Text style={{ color: "#fff", paddingHorizontal: 6 }}>
                      X
                    </Text>
                  </TouchableOpacity>
                  <Image
                    source={{ uri }}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                    }}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Button
                title={
                  finalizandoOcorrencia ? "Enviando..." : "Enviar e Finalizar"
                }
                onPress={handleEnviarOcorrencia}
                disabled={finalizandoOcorrencia || !descricaoOcorrencia.trim()}
              />
              <Button
                title="Cancelar"
                color="#ef4444"
                onPress={handleCancelarOcorrencia}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 16,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  label: {
    fontWeight: "bold",
    color: "#374151",
    marginTop: 4,
  },
  value: {
    color: "#111827",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2563eb",
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
});
