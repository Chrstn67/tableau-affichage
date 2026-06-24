import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import PasswordGate from "./components/common/PasswordGate.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PasswordGate>
          <App />
        </PasswordGate>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
