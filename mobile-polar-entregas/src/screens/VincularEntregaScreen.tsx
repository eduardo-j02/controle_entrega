import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import QRCodeScanner from "../components/QRCodeScanner";
import { criarEntrega, buscarNotaPorChave } from "../services/api";

export default function VincularEntregaScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "VincularEntrega">) {
  const [chave, setChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [aceitouTermo, setAceitouTermo] = useState(false);
  const [mostrarTermo, setMostrarTermo] = useState(true);

  const handleVincular = async () => {
    setLoading(true);
    try {
      if (chave.length !== 44) {
        Alert.alert("Erro", "Chave NFe inválida!");
        setLoading(false);
        return;
      }
      const nota = await buscarNotaPorChave(chave);
      if (!nota) {
        Alert.alert("Erro", "Nota não encontrada para a chave informada!");
        setLoading(false);
        return;
      }
      await criarEntrega({ notaId: nota.id });
      Alert.alert("Sucesso", "Entrega vinculada ao motorista!");
      setChave("");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao vincular entrega");
    } finally {
      setLoading(false);
    }
  };

  const handleScanned = (novaChave: string) => {
    setChave(novaChave);
    Alert.alert("Chave NFe detectada", novaChave);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vincular Entrega</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite a chave NFe (44 dígitos)"
        value={chave}
        onChangeText={setChave}
        keyboardType="numeric"
        maxLength={44}
      />
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <Button
          title={loading ? "Vinculando..." : "Vincular"}
          onPress={handleVincular}
          disabled={loading || !aceitouTermo}
        />
        <Button title="Ler QR Code" onPress={() => setModalVisible(true)} />
      </View>
      <View style={{ marginTop: 32 }}>
        <Button
          title="Minhas Entregas"
          onPress={() => navigation.navigate("MinhasEntregas")}
        />
      </View>
      <QRCodeScanner
        visible={modalVisible}
        onScanned={handleScanned}
        onClose={() => setModalVisible(false)}
      />
      <Modal visible={mostrarTermo} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.termoContainer}>
            <Text style={styles.termoTitulo}>Termo de Consentimento</Text>
            <Text style={styles.termoTexto}>
              Ao prosseguir, você concorda com a coleta e o uso dos seus dados
              pessoais, localização, assinatura e comprovantes para fins de
              controle de entrega, auditoria e cumprimento de obrigações legais,
              conforme a LGPD. Os dados poderão ser compartilhados com clientes,
              autoridades e órgãos reguladores, quando necessário. Você declara
              estar ciente e de acordo com estes termos.
            </Text>
            <TouchableOpacity
              style={styles.botaoAceitar}
              onPress={() => {
                setAceitouTermo(true);
                setMostrarTermo(false);
              }}
            >
              <Text style={styles.botaoAceitarTexto}>
                Li e aceito os termos
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 32,
    color: "#2563eb",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  termoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  termoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2563eb",
    textAlign: "center",
  },
  termoTexto: {
    fontSize: 15,
    color: "#222",
    marginBottom: 24,
    textAlign: "center",
  },
  botaoAceitar: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  botaoAceitarTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
