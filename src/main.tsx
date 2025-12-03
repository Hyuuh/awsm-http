import "@/styles/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@/features/theme/theme-provider";
import MainLayout from "./layout";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="awsm-ui-theme">
      <MainLayout>
        <App />
      </MainLayout>
    </ThemeProvider>
  </React.StrictMode>
);
