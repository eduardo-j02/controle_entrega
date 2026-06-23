import React, { useState, useEffect } from "react";
import { View, Button, Text, Modal } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

interface QRCodeScannerProps {
  visible: boolean;
  onScanned: (data: string) => void;
  onClose: () => void;
}

export default function QRCodeScanner({
  visible,
  onScanned,
  onClose,
}: QRCodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!visible) {
      setScanned(false);
    }
  }, [visible]);

  if (!visible) return null;

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Permissão para usar a câmera é necessária.</Text>
          <Button title="Permitir câmera" onPress={requestPermission} />
          <Button title="Fechar" onPress={onClose} />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "code128",
              "code39",
              "code93",
              "upc_a",
              "upc_e",
              "itf14",
              "codabar",
              "qr",
            ],
          }}
          onBarcodeScanned={(result: BarcodeScanningResult) => {
            if (!scanned) {
              setScanned(true);
              onScanned(result.data);
              onClose();
            }
          }}
        />
        {scanned && (
          <View
            style={{
              position: "absolute",
              bottom: 50,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Código lido!</Text>
            <Button title="Fechar" onPress={onClose} />
          </View>
        )}
        {!scanned && (
          <View style={{ position: "absolute", top: 40, right: 20 }}>
            <Button title="Fechar" onPress={onClose} />
          </View>
        )}
      </View>
    </Modal>
  );
}
