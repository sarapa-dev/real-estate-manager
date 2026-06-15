import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, Ban, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useReservation } from "../hooks/useReservation"
import { clientsService } from "../services/clientsService"
import { propertiesService } from "../services/propertiesService"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../lib/reservationUtils"
import {
  formatDate,
  formatPrice,
  PROPERTY_TYPE_LABELS,
} from "../lib/propertyUtils"
import type { ReservationStatus } from "../types/reservation"
import type { Client } from "../types/client"
import type { Property } from "../types/property"

const TIMELINE_ORDER: ReservationStatus[] = ["new", "confirmed", "completed"]

const STATUS_OPTIONS: ReservationStatus[] = [
  "new",
  "confirmed",
  "completed",
  "cancelled",
]

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function StatusTimeline({ status }: { status: ReservationStatus }) {
  const isCancelled = status === "cancelled"

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <h3 className="font-semibold">Status rezervacije</h3>

      {isCancelled ? (
        <div className="flex items-center gap-3 rounded-md bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              RESERVATION_STATUS_CLASSES.cancelled
            )}
          >
            {RESERVATION_STATUS_LABELS.cancelled}
          </span>
          <span className="text-sm text-muted-foreground">
            Rezervacija je otkazana.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-0">
          {TIMELINE_ORDER.map((step, i) => {
            const stepIndex = TIMELINE_ORDER.indexOf(status)
            const currentIndex = TIMELINE_ORDER.indexOf(step)
            const isDone = currentIndex <= stepIndex
            const isActive = step === status
            const isLast = i === TIMELINE_ORDER.length - 1

            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground",
                      isActive && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {currentIndex + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs whitespace-nowrap",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {RESERVATION_STATUS_LABELS[step]}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "mx-1 mb-5 h-0.5 flex-1 transition-colors",
                      stepIndex > i ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ReservationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { reservation, isLoading, error, notFound, refetch, updateStatus } =
    useReservation(id!)

  const [client, setClient] = useState<Client | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [sideLoading, setSideLoading] = useState(true)

  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(
    null
  )
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!reservation) return
    setSideLoading(true)

    Promise.all([
      clientsService.getById(reservation.clientId),
      propertiesService.getById(reservation.propertyId),
    ])
      .then(([clientData, propertyData]) => {
        setClient(clientData)
        setProperty(propertyData)
      })
      .catch(() => {})
      .finally(() => setSideLoading(false))
  }, [reservation])

  function openStatusModal() {
    setPendingStatus(reservation?.status ?? "new")
    setStatusModalOpen(true)
  }

  async function handleStatusChange() {
    if (!pendingStatus) return
    setIsChangingStatus(true)
    try {
      await updateStatus(pendingStatus)
      toast.success("Status rezervacije je promenjen.")
      setStatusModalOpen(false)
    } catch {
      toast.error("Greška pri promeni statusa.")
    } finally {
      setIsChangingStatus(false)
    }
  }

  async function handleCancel() {
    setIsCancelling(true)
    try {
      await updateStatus("cancelled")
      toast.success("Rezervacija je otkazana.")
      setCancelOpen(false)
    } catch {
      toast.error("Greška pri otkazivanju.")
    } finally {
      setIsCancelling(false)
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-xl font-semibold">Rezervacija nije pronađena</p>
        <p className="text-sm text-muted-foreground">
          Rezervacija sa ovim ID-em ne postoji ili je obrisana.
        </p>
        <Button variant="outline" onClick={() => navigate("/reservations")}>
          <ArrowLeft className="mr-2 size-4" /> Nazad na listu
        </Button>
      </div>
    )
  }

  if (isLoading) return <DetailSkeleton />

  if (error || !reservation) {
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

  const isCancelled = reservation.status === "cancelled"
  const isPast =
    new Date(`${reservation.date}T${reservation.time}`) < new Date()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/reservations" className="hover:text-foreground">
          Rezervacije
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          Rezervacija #{reservation.id}
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Rezervacija #{reservation.id}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                RESERVATION_STATUS_CLASSES[reservation.status]
              )}
            >
              {RESERVATION_STATUS_LABELS[reservation.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Kreirano: {formatDate(reservation.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={openStatusModal}
            disabled={isCancelled}
          >
            <RefreshCw className="mr-2 size-4" /> Promeni status
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setCancelOpen(true)}
            disabled={isCancelled}
          >
            <Ban className="mr-2 size-4" /> Otkaži
          </Button>
        </div>
      </div>

      <StatusTimeline status={reservation.status} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 font-semibold">Termin obilaska</h3>
            <InfoRow label="Datum" value={formatDate(reservation.date)} />
            <InfoRow label="Vreme" value={reservation.time} />
            <InfoRow
              label="Napomena"
              value={
                reservation.notes ? (
                  <span className="block max-w-60 text-right">
                    {reservation.notes}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">—</span>
                )
              }
            />
            {isPast && reservation.status === "new" && (
              <div className="mt-3 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                Termin je prošao, a rezervacija je još uvek u statusu "Nova".
                Razmotrite ažuriranje statusa.
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 font-semibold">Nekretnina</h3>
            {sideLoading ? (
              <Skeleton className="h-20 w-full rounded" />
            ) : property ? (
              <div className="flex items-start gap-4">
                <img
                  src={property.imageUrl}
                  alt={property.title}
                  className="size-16 shrink-0 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/e5e7eb/9ca3af?text=N/A"
                  }}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/properties/${reservation.propertyId}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {property.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {property.city}, {property.municipality}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {PROPERTY_TYPE_LABELS[property.type]} ·{" "}
                    {property.squareMeters} m²
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {formatPrice(
                      property.price,
                      property.currency,
                      property.purpose
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nekretnina je obrisana.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Klijent</h3>
            {sideLoading ? (
              <Skeleton className="h-20 w-full rounded" />
            ) : client ? (
              <div className="space-y-2">
                <Link
                  to={`/clients/${reservation.clientId}`}
                  className="block font-medium hover:underline"
                >
                  {client.name}
                </Link>
                <Separator />
                <a
                  href={`tel:${client.phone}`}
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {client.phone}
                </a>
                <a
                  href={`mailto:${client.email}`}
                  className="block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {client.email}
                </a>
                {client.notes && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      {client.notes}
                    </p>
                  </>
                )}
                <div className="pt-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link to={`/clients/${reservation.clientId}`}>
                      Profil klijenta
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Klijent je obrisan.
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Promeni status rezervacije</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {STATUS_OPTIONS.map((status) => (
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
                    RESERVATION_STATUS_CLASSES[status]
                  )}
                >
                  {RESERVATION_STATUS_LABELS[status]}
                </span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusModalOpen(false)}
              disabled={isChangingStatus}
            >
              Odustani
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!pendingStatus || isChangingStatus}
            >
              {isChangingStatus ? "Čuvam..." : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Otkazati rezervaciju?</AlertDialogTitle>
            <AlertDialogDescription>
              Status će biti promenjen u "Otkazana". Status možete naknadno
              promeniti ako je potrebno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Odustani
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? "Otkazivanje..." : "Otkaži rezervaciju"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
