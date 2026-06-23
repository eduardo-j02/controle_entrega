import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AlterarPerfil from "./pages/AlterarPerfil";
import AlterarSenha from "./pages/AlterarSenha";
import Usuarios from "./pages/Usuarios";

import Rotas from "./pages/Rotas";
import NotasPorRota from "./pages/NotasPorRota";
import Entregas from "./pages/Entregas";
import "./index.css";
import Ocorrencias from "./pages/Ocorrencias";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rotas"
            element={
              <ProtectedRoute>
                <Rotas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rotas/:id"
            element={
              <ProtectedRoute>
                <NotasPorRota />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alterar-perfil"
            element={
              <ProtectedRoute>
                <AlterarPerfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alterar-senha"
            element={
              <ProtectedRoute>
                <AlterarSenha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <AdminRoute>
                <Usuarios />
              </AdminRoute>
            }
          />
          <Route
            path="/entregas"
            element={
              <ProtectedRoute>
                <Entregas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ocorrencias"
            element={
              <ProtectedRoute>
                <Ocorrencias />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
