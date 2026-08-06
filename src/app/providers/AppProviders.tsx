import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../features/auth/application/AuthProvider";

export const AppProviders = ({ children }: { readonly children: ReactNode }) => (
  <AuthProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </AuthProvider>
);
