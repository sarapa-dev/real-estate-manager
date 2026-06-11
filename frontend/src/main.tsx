import { createRoot } from "react-dom/client"

import "./index.css"
import { Toaster } from "sonner"
import { router } from "./router.tsx"

import { RouterProvider } from "react-router/dom"
import { AuthProvider } from "./contexts/AuthContext.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  </AuthProvider>
)
