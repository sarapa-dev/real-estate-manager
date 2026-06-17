import { useLocation, useNavigate, NavLink, Outlet, Link } from "react-router"
import {
  LayoutDashboard,
  Home,
  Users,
  ClipboardList,
  CalendarDays,
  Settings,
  LogOut,
  Building2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ModeToggle } from "./ModeToggle"
import { useAuth } from "@/contexts/AuthContext"

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/properties", icon: Home, label: "Nekretnine" },
  { to: "/clients", icon: Users, label: "Klijenti" },
  { to: "/reservations", icon: ClipboardList, label: "Rezervacije" },
  { to: "/calendar", icon: CalendarDays, label: "Kalendar" },
  { to: "/settings", icon: Settings, label: "Podešavanja" },
]

// Breadcrumb
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  properties: "Nekretnine",
  clients: "Klijenti",
  reservations: "Rezervacije",
  calendar: "Kalendar",
  settings: "Podešavanja",
  create: "Novo",
  edit: "Izmena",
}

function getSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (/^\d+$/.test(segment) || segment.length > 8) return "Detalji"
  return segment
}

function AppBreadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          const href = "/" + segments.slice(0, i + 1).join("/")
          const label = getSegmentLabel(seg)

          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <span className="truncate leading-tight font-semibold">
                    Nova Nekretnina
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
                  const isActive =
                    pathname === to || pathname.startsWith(to + "/")

                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={label}
                        isActive={isActive}
                      >
                        <NavLink to={to}>
                          <Icon className="size-4 shrink-0" />
                          <span>{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user?.name ?? "Korisnik"}
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("") ?? "A"}
                    </div>
                    <div className="min-w-0 flex-1 text-left leading-tight">
                      <p className="truncate text-sm font-medium">
                        {user?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52">
                  <div className="mb-1 border-b px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    Odjavi se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <AppBreadcrumb />
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
