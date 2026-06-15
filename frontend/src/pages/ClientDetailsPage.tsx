import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { CalendarPlus, ArrowLeft, Pencil, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useClient } from "../hooks/useClient"
import { reservationsService } from "../services/reservationsService"
import { propertiesService } from "../services/propertiesService"
import {
  INTEREST_TYPE_LABELS,
  INTEREST_TYPE_CLASSES,
  formatBudget,
} from "../lib/clientUtils"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../lib/reservationUtils"
import { formatDate } from "../lib/propertyUtils"
import type { Reservation } from "../types/reservation"
import type { Property } from "../types/property"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

function ClientSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { client, isLoading, error, notFound, refetch } = useClient(id!)

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({})
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setHistoryLoading(true)

    Promise.all([
      reservationsService.getByClientId(id),
      propertiesService.getAll(),
    ])
      .then(([reservationData, propertyData]) => {
        // Nearest upcoming first, past visits at bottom
        const sorted = [...reservationData].sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() -
            new Date(`${b.date}T${b.time}`).getTime()
        )
        setReservations(sorted)

        const map: Record<string, Property> = {}
        propertyData.forEach((p) => {
          map[p.id] = p
        })
        setPropertyMap(map)
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [id])

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-xl font-semibold">Klijent nije pronađen</p>
        <p className="text-sm text-muted-foreground">
          Klijent sa ovim ID-em ne postoji ili je obrisan.
        </p>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          <ArrowLeft className="mr-2 size-4" /> Nazad na listu
        </Button>
      </div>
    )
  }

  if (isLoading) return <ClientSkeleton />

  if (error || !client) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-destructive">
          {error ?? "Neočekivana greška."}
        </p>
        <Button variant="outline" size="sm" onClick={refetch}>
          Pokušaj ponovo
        </Button>
      </div>
    )
  }

  const scheduleUrl = `/reservations/create?clientId=${id}`

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/clients" className="hover:text-foreground">
          Klijenti
        </Link>
        <span>/</span>
        <span className="max-w-60 truncate font-medium text-foreground">
          {client.name}
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                INTEREST_TYPE_CLASSES[client.interestType]
              )}
            >
              {INTEREST_TYPE_LABELS[client.interestType]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Budžet:{" "}
            <span className="font-medium text-foreground">
              {formatBudget(client.budgetFrom, client.budgetTo)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/clients/${id}/edit`)}
          >
            <Pencil className="mr-2 size-4" /> Izmeni
          </Button>
          <Button asChild>
            <Link to={scheduleUrl}>
              <CalendarPlus className="mr-2 size-4" /> Nova rezervacija
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="space-y-3 rounded-lg border bg-card p-5">
            <h3 className="font-semibold">Kontakt podaci</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary"
              >
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                {client.email}
              </a>
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary"
              >
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                {client.phone}
              </a>
            </div>
          </div>

          {client.notes && (
            <div className="space-y-2 rounded-lg border bg-card p-5">
              <h3 className="font-semibold">Napomene</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Interesovanje</h3>
            <InfoRow
              label="Tip"
              value={
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    INTEREST_TYPE_CLASSES[client.interestType]
                  )}
                >
                  {INTEREST_TYPE_LABELS[client.interestType]}
                </span>
              }
            />
            <InfoRow
              label="Budžet od"
              value={`${client.budgetFrom.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} EUR`}
            />
            <InfoRow
              label="Budžet do"
              value={
                <span className="font-semibold text-primary">
                  {`${client.budgetTo.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} EUR`}
                </span>
              }
            />
          </div>

          {client.preferredCities.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <h3 className="font-semibold">Preferirani gradovi</h3>
              <div className="flex flex-wrap gap-2">
                {client.preferredCities.map((city) => (
                  <Badge key={city} variant="secondary">
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Istorija rezervacija</h2>
            {!historyLoading && (
              <p className="text-sm text-muted-foreground">
                {reservations.length > 0
                  ? `${reservations.length} termin${reservations.length === 1 ? "" : "a"}`
                  : "Još nema rezervacija"}
              </p>
            )}
          </div>
          <Button asChild size="sm">
            <Link to={scheduleUrl}>
              <CalendarPlus className="mr-2 size-4" />
              Nova rezervacija
            </Link>
          </Button>
        </div>

        {historyLoading && (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Nekretnina", "Datum", "Vreme", "Status", ""].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!historyLoading && reservations.length === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Još uvek nema zakazanih obilazaka za ovog klijenta.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to={scheduleUrl}>Zakaži obilazak</Link>
            </Button>
          </div>
        )}

        {!historyLoading && reservations.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nekretnina</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Vreme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => {
                  const property = propertyMap[r.propertyId]
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {property ? (
                          <Link
                            to={`/properties/${r.propertyId}`}
                            className="hover:underline"
                          >
                            <span className="block max-w-55 truncate">
                              {property.title}
                            </span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {property.city}, {property.municipality}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Obrisana nekretnina
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">
                        {formatDate(r.date)}
                      </TableCell>

                      <TableCell className="text-sm">{r.time}</TableCell>

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

                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/reservations/${r.id}`}>Detalji</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
