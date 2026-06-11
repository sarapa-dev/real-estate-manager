import { Outlet, NavLink, useNavigate, useLocation } from "react-router"
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  CalendarDays,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/properties", icon: Home, label: "Nekretnine" },
  { to: "/clients", icon: Users, label: "Klijenti" },
  { to: "/reservations", icon: ClipboardList, label: "Rezervacije" },
  { to: "/calendar", icon: CalendarDays, label: "Kalendar" },
  { to: "/settings", icon: Settings, label: "Podešavanja" },
]

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  properties: "Nekretnine",
  clients: "Klijenti",
  reservations: "Rezervacije",
  calendar: "Kalendar",
  settings: "Podešavanja",
  create: "Novo",
  edit: "Izmena",
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1
        const label = routeLabels[seg] ?? seg
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" />}
            <span className={isLast ? "font-medium text-foreground" : ""}>
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2.5 border-b px-4 py-3.75 font-semibold">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="text-sm">Nova Nekretnina</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t p-3">
          <div className="px-2 py-1">
            <p className="text-sm leading-tight font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Odjavi se
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-13.75 shrink-0 items-center border-b bg-card px-6">
          <Breadcrumbs />
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
