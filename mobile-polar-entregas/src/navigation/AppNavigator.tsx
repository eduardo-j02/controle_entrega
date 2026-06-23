import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import VincularEntregaScreen from "../screens/VincularEntregaScreen";
import MinhasEntregasScreen from "../screens/MinhasEntregasScreen";

export type RootStackParamList = {
  Login: undefined;
  VincularEntrega: undefined;
  MinhasEntregas: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VincularEntrega"
          component={VincularEntregaScreen}
          options={{ title: "Vincular Entrega" }}
        />
        <Stack.Screen
          name="MinhasEntregas"
          component={MinhasEntregasScreen}
          options={{ title: "Minhas Entregas" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
