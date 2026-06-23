import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, #e0e7ff 0%, #f7f8fa 100%)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header onLogout={logout} />
      <Sidebar />
      <main
        style={{
          marginLeft: 210,
          paddingTop: 80,
          minHeight: "calc(100vh - 64px)",
          width: "calc(100vw - 210px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
