import React from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./Routes";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import { SettingsProvider } from "./contexts/SettingsContext"; // Import SettingsProvider
import { ToastProvider } from "./components/ui/ToastContainer"; // Import ToastProvider

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <Routes />
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;