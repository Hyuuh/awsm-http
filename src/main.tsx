import "@/styles/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import MainLayout from "./layout";
import { ThemeProvider } from "@/features/theme/theme-provider";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="awsm-ui-theme">
        <MainLayout>
          <App />
        </MainLayout>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
