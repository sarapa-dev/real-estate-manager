import { Link, useNavigate } from "react-router"
import {
  Building2,
  Users,
  CalendarCheck,
  TrendingUp,
  CircleDot,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useDashboard } from "../hooks/useDashboard"
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_CLASSES,
  PROPERTY_TYPE_LABELS,
  formatPrice,
  formatDate,
} from "../lib/propertyUtils"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../lib/reservationUtils"
import { useAuth } from "../contexts/AuthContext"

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  isLoading: boolean
  to?: string
  accent?: "default" | "green" | "yellow" | "blue"
}

function StatCard({
  label,
  value,
  icon,
  isLoading,
  to,
  accent = "default",
}: StatCardProps) {
  const accentClass = {
    default: "text-foreground",
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    blue: "text-blue-600  dark:text-blue-400",
  }[accent]

  const content = (
    <div
      className={cn(
        "space-y-3 rounded-lg border bg-card p-5 transition-colors",
        to && "cursor-pointer hover:border-primary/40 hover:bg-accent/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className={cn("text-3xl font-bold tracking-tight", accentClass)}>
          {value}
        </p>
      )}
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }
  return content
}

const STATUS_CHART_COLORS: Record<string, string> = {
  active: "bg-green-500",
  reserved: "bg-yellow-500",
  sold: "bg-gray-400",
  rented: "bg-blue-500",
}

function StatusChart({
  breakdown,
  total,
  isLoading,
}: {
  breakdown: { status: string; count: number }[]
  total: number
  isLoading: boolean
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <h3 className="font-semibold">Nekretnine po statusu</h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">Nema podataka.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {breakdown.map(({ status, count }) => (
              <div
                key={status}
                className={cn(
                  STATUS_CHART_COLORS[status] ?? "bg-muted",
                  "transition-all"
                )}
                style={{ width: `${(count / total) * 100}%` }}
                title={`${PROPERTY_STATUS_LABELS[status] ?? status}: ${count}`}
              />
            ))}
          </div>

          <div className="space-y-1.5">
            {breakdown.map(({ status, count }) => (
              <div
                key={status}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block size-2.5 rounded-full",
                      STATUS_CHART_COLORS[status] ?? "bg-muted"
                    )}
                  />
                  <span className="text-muted-foreground">
                    {PROPERTY_STATUS_LABELS[status] ?? status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{count}</span>
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {Math.round((count / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  linkTo,
  linkLabel,
}: {
  title: string
  linkTo: string
  linkLabel: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button variant="ghost" size="sm" asChild>
        <Link to={linkTo}>{linkLabel} →</Link>
      </Button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-lg xl:col-span-2" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <Skeleton className="h-56 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useDashboard()
  const navigate = useNavigate()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Dobro jutro"
    if (h < 18) return "Dobar dan"
    return "Dobro veče"
  })()

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="mr-2 size-4" /> Pokušaj ponovo
        </Button>
      </div>
    )
  }

  const {
    stats,
    recentReservations,
    recentProperties,
    clientMap,
    propertyMap,
    statusBreakdown,
  } = data!

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Pregled aktivnosti agencije za{" "}
          {new Date().toLocaleDateString("sr-Latn-RS", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Ukupno nekretnina"
          value={stats.totalProperties}
          icon={<Building2 className="size-5" />}
          isLoading={false}
          to="/properties"
        />
        <StatCard
          label="Aktivne nekretnine"
          value={stats.activeProperties}
          icon={<CircleDot className="size-5" />}
          isLoading={false}
          to="/properties?status=active"
          accent="green"
        />
        <StatCard
          label="Rezervisane"
          value={stats.reservedProperties}
          icon={<TrendingUp className="size-5" />}
          isLoading={false}
          to="/properties?status=reserved"
          accent="yellow"
        />
        <StatCard
          label="Klijenti"
          value={stats.totalClients}
          icon={<Users className="size-5" />}
          isLoading={false}
          to="/clients"
          accent="blue"
        />
        <StatCard
          label="Obilasci danas"
          value={stats.visitationsToday}
          icon={<CalendarCheck className="size-5" />}
          isLoading={false}
          to="/reservations"
          accent={stats.visitationsToday > 0 ? "blue" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StatusChart
            breakdown={statusBreakdown}
            total={stats.totalProperties}
            isLoading={false}
          />
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-5">
          <h3 className="font-semibold">Brze akcije</h3>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/properties/create")}
            >
              <Building2 className="mr-2 size-4" />
              Dodaj nekretninu
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/clients/create")}
            >
              <Users className="mr-2 size-4" />
              Dodaj klijenta
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/reservations/create")}
            >
              <CalendarCheck className="mr-2 size-4" />
              Zakaži obilazak
            </Button>
          </div>

          {stats.visitationsToday > 0 && (
            <div className="rounded-md bg-blue-50 px-3 py-2.5 text-sm dark:bg-blue-900/20">
              <p className="font-medium text-blue-800 dark:text-blue-300">
                {stats.visitationsToday} obilazak
                {stats.visitationsToday > 1 ? "a" : ""} danas
              </p>
              <Link
                to="/reservations"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Pogledaj sve →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Poslednje rezervacije"
          linkTo="/reservations"
          linkLabel="Sve rezervacije"
        />

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Klijent</TableHead>
                <TableHead>Nekretnina</TableHead>
                <TableHead>Datum / Vreme</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReservations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Još nema rezervacija.
                  </TableCell>
                </TableRow>
              ) : (
                recentReservations.map((r) => {
                  const client = clientMap[r.clientId]
                  const property = propertyMap[r.propertyId]
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/reservations/${r.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{r.id}
                      </TableCell>

                      <TableCell className="font-medium">
                        {client ? (
                          <Link
                            to={`/clients/${r.clientId}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {client.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Obrisan
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {property ? (
                          <Link
                            to={`/properties/${r.propertyId}`}
                            className="block max-w-50 truncate text-sm hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {property.title}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Obrisana
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm whitespace-nowrap">
                        <div>{formatDate(r.date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.time}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            RESERVATION_STATUS_CLASSES[r.status]
                          )}
                        >
                          {RESERVATION_STATUS_LABELS[r.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Poslednje dodane nekretnine"
          linkTo="/properties"
          linkLabel="Sve nekretnine"
        />

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Slika</TableHead>
                <TableHead>Naziv</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dodato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProperties.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Još nema nekretnina.
                  </TableCell>
                </TableRow>
              ) : (
                recentProperties.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/properties/${p.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="h-10 w-14 rounded bg-muted object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/56x40/e5e7eb/9ca3af?text=N/A"
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Link
                        to={`/properties/${p.id}`}
                        className="block max-w-50 truncate font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {p.city}, {p.municipality}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {PROPERTY_TYPE_LABELS[p.type] ?? p.type}
                    </TableCell>

                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {formatPrice(p.price, p.currency, p.purpose)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          PROPERTY_STATUS_CLASSES[p.status]
                        )}
                      >
                        {PROPERTY_STATUS_LABELS[p.status]}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
