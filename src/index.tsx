import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { getStoredTheme, applyTheme } from "./utils/theme";
import AppWrapper from "./AppWrapper";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloack/Keycloak";
import { BrowserRouter } from "react-router-dom";
import { ModalProvider } from "./components/ModalProvider";

const eventLogger = (event: any, error: any) => {

  if (error) {
    console.error("🔴 Keycloak error:", error);
  }
};

const tokenLogger = (tokens: any) => {
  if (tokens?.token) {
    localStorage.setItem("token", tokens.token);
    localStorage.setItem("refreshToken", tokens.refreshToken || "");
    localStorage.setItem("Type_login", "SSO");
  } else if (localStorage.getItem("Type_login") === "SSO") {
    localStorage.clear();
  }
};

// Áp dụng theme ngay từ đầu để tránh nháy sáng/tối
applyTheme(getStoredTheme());

// Watch system theme changes and update if using system theme
if (typeof window !== "undefined") {
  const updateThemeIfSystem = () => {
    const stored = getStoredTheme();
    if (stored === "system") {
      applyTheme("system");
    }
  };
  
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", updateThemeIfSystem);
  } else {
    mediaQuery.addListener(updateThemeIfSystem);
  }
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);


// Render without StrictMode to avoid Keycloak double initialization
root.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    onEvent={eventLogger}
    onTokens={tokenLogger}
    initOptions={{
      onLoad: "check-sso",
      checkLoginIframe: false,
      redirectUri: globalThis.window.location.href.split('#')[0], // Giữ nguyên URL hiện tại, bỏ hash
    }}
  >
    <BrowserRouter>
      <ModalProvider>
        <AppWrapper />
      </ModalProvider>
    </BrowserRouter>
  </ReactKeycloakProvider>
);

reportWebVitals();
