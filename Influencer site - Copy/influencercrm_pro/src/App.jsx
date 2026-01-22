import React from "react";
import Routes from "./Routes";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import { ToastProvider } from "./components/ui/ToastContainer"; // Import ToastProvider

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;