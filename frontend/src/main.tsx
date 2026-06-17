import { createRoot } from "react-dom/client"

import "./index.css"
import { Toaster } from "sonner"
import { router } from "./router.tsx"

import { RouterProvider } from "react-router/dom"
import { AuthProvider } from "./contexts/AuthContext.tsx"
import { ThemeProvider } from "./contexts/ThemeProvider.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  </AuthProvider>
)
