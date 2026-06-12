import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { CalendarPlus, Pencil, RefreshCw, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import PropertyStatusBadge from "../components/properties/PropertyStatusBadge"
import PropertyGallery from "../components/properties/PropertyGallery"
import PropertyReservations from "../components/properties/PropertyReservations"

import { useProperty } from "../hooks/useProperty"
import { reservationsService } from "../services/reservationsService"
import { clientsService } from "../services/clientsService"

import {
  formatPrice,
  formatRooms,
  formatDate,
  PROPERTY_TYPE_LABELS,
  PROPERTY_PURPOSE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_CLASSES,
  FEATURE_LABELS,
} from "../lib/propertyUtils"

import type { PropertyStatus } from "../types/property"
import type { Reservation } from "../types/reservation"
import type { Client } from "../types/client"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

function PropertySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-105 w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}

const STATUSES: PropertyStatus[] = ["active", "reserved", "sold", "rented"]

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { property, isLoading, error, notFound, refetch, updateStatus } =
    useProperty(id!)

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [clientMap, setClientMap] = useState<Record<string, Client>>({})
  const [reservationsLoading, setReservationsLoading] = useState(true)

  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<PropertyStatus | null>(
    null
  )
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!id) return
    setReservationsLoading(true)

    Promise.all([
      reservationsService.getByPropertyId(id),
      clientsService.getAll(),
    ])
      .then(([reservationData, clientData]) => {
        const sorted = [...reservationData].sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() -
            new Date(`${b.date}T${b.time}`).getTime()
        )
        setReservations(sorted)

        const map: Record<string, Client> = {}
        clientData.forEach((c) => {
          map[c.id] = c
        })
        setClientMap(map)
      })
      .catch(() => {})
      .finally(() => setReservationsLoading(false))
  }, [id])

  function openStatusModal() {
    setPendingStatus(property?.status ?? null)
    setStatusModalOpen(true)
  }

  async function handleStatusUpdate() {
    if (!pendingStatus) return
    setIsUpdatingStatus(true)
    try {
      await updateStatus(pendingStatus)
      toast.success("Status nekretnine je promenjen.")
      setStatusModalOpen(false)
    } catch {
      toast.error("Greška pri promeni statusa. Pokušajte ponovo.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-xl font-semibold">Nekretnina nije pronađena</p>
        <p className="text-sm text-muted-foreground">
          Nekretnina sa ovim ID-em ne postoji ili je obrisana.
        </p>
        <Button variant="outline" onClick={() => navigate("/properties")}>
          <ArrowLeft className="mr-2 size-4" /> Nazad na listu
        </Button>
      </div>
    )
  }

  if (isLoading) return <PropertySkeleton />

  if (error || !property) {
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

  const pricePerM2 = Math.round(property.price / property.squareMeters)
  const fmtPerM2 = new Intl.NumberFormat("de-DE").format(pricePerM2)

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/properties" className="hover:text-foreground">
          Nekretnine
        </Link>
        <span>/</span>
        <span className="max-w-65 truncate font-medium text-foreground">
          {property.title}
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {property.title}
            </h1>
            <PropertyStatusBadge status={property.status} />
          </div>
          <p className="text-xl font-semibold text-primary">
            {formatPrice(property.price, property.currency, property.purpose)}
          </p>
          <p className="text-sm text-muted-foreground">
            Dodato {formatDate(property.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/properties/${id}/edit`)}
          >
            <Pencil className="mr-2 size-4" /> Izmeni
          </Button>
          <Button variant="outline" onClick={openStatusModal}>
            <RefreshCw className="mr-2 size-4" /> Promeni status
          </Button>
          <Button asChild>
            <Link to={`/reservations/create?propertyId=${id}`}>
              <CalendarPlus className="mr-2 size-4" /> Zakaži obilazak
            </Link>
          </Button>
        </div>
      </div>

      <PropertyGallery
        imageUrl={property.imageUrl}
        gallery={property.gallery}
        title={property.title}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {property.description && (
            <div className="space-y-2 rounded-lg border bg-card p-5">
              <h3 className="font-semibold">Opis</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </div>
          )}

          {property.features.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-card p-5">
              <h3 className="font-semibold">Karakteristike</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {FEATURE_LABELS[f] ?? f}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Osnovne informacije</h3>
            <InfoRow
              label="Tip"
              value={PROPERTY_TYPE_LABELS[property.type] ?? property.type}
            />
            <InfoRow
              label="Namena"
              value={
                PROPERTY_PURPOSE_LABELS[property.purpose] ?? property.purpose
              }
            />
            <InfoRow label="Grad" value={property.city} />
            <InfoRow label="Opština" value={property.municipality} />
            <InfoRow label="Adresa" value={property.address} />
            <InfoRow label="Kvadratura" value={`${property.squareMeters} m²`} />
            {property.rooms !== null && (
              <InfoRow label="Broj soba" value={formatRooms(property.rooms)} />
            )}
            {property.floor !== null && property.totalFloors !== null && (
              <InfoRow
                label="Sprat"
                value={
                  property.floor === 0
                    ? "Prizemlje"
                    : `${property.floor}/${property.totalFloors}`
                }
              />
            )}
            {property.yearBuilt && (
              <InfoRow
                label="Godina izgradnje"
                value={String(property.yearBuilt)}
              />
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Finansije</h3>
            <InfoRow
              label="Cena"
              value={
                <span className="font-semibold text-primary">
                  {formatPrice(
                    property.price,
                    property.currency,
                    property.purpose
                  )}
                </span>
              }
            />
            <InfoRow
              label="Cena po m²"
              value={`${fmtPerM2} ${property.currency}/m²`}
            />
            {property.purpose === "rent" && (
              <InfoRow
                label="Mesečna renta"
                value={formatPrice(property.price, property.currency, "rent")}
              />
            )}
          </div>

          <div className="space-y-2 rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Kontakt agent</h3>
            <p className="text-sm font-medium">{property.agent.name}</p>
            <a
              href={`tel:${property.agent.phone}`}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {property.agent.phone}
            </a>
            <a
              href={`mailto:${property.agent.email}`}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {property.agent.email}
            </a>
          </div>
        </div>
      </div>

      <Separator />

      <PropertyReservations
        propertyId={id!}
        reservations={reservations}
        clients={clientMap}
        isLoading={reservationsLoading}
      />

      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Promeni status nekretnine</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setPendingStatus(status)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                  pendingStatus === status
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    PROPERTY_STATUS_CLASSES[status]
                  )}
                >
                  {PROPERTY_STATUS_LABELS[status]}
                </span>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              Odustani
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!pendingStatus || isUpdatingStatus}
            >
              {isUpdatingStatus ? "Čuvam..." : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
