import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./lib/AuthContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            toastOptions={{
              unstyled: false,
              style: {
                background: "#172033",
                color: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #2d5f87",
                boxShadow: "0 16px 40px rgba(23, 32, 51, 0.24)",
              },
              classNames: {
                toast: "font-sans",
                title: "text-sm font-semibold",
                description: "text-xs text-white/70",
                success: "!border-[#287271] !bg-[#173c46] !text-white",
                error: "!border-[#b42318] !bg-[#451b1b] !text-white",
                warning: "!border-[#b54708] !bg-[#4a2e12] !text-white",
                info: "!border-[#184e77] !bg-[#172033] !text-white",
              },
            }}
          />
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
