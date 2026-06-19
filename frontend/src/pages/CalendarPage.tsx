import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { reservationsService } from "../services/reservationsService"
import { clientsService } from "../services/clientsService"
import { propertiesService } from "../services/propertiesService"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../lib/reservationUtils"
import type { Reservation, ReservationStatus } from "../types/reservation"
import type { Client } from "../types/client"
import type { Property } from "../types/property"

interface EnrichedReservation extends Reservation {
  clientName: string
  propertyTitle: string
  propertyCity: string
}

const WEEKDAYS = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"]

const STATUS_OPTIONS: ReservationStatus[] = [
  "new",
  "confirmed",
  "completed",
  "cancelled",
]

// color per reservation status
const DOT_CLASSES: Record<ReservationStatus, string> = {
  new: "bg-blue-500",
  confirmed: "bg-green-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-400",
}

const NO_FILTER = "_"

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days: Date[] = []
  let current = start
  while (current <= end) {
    days.push(current)
    current = addDays(current, 1)
  }
  return days
}

function ReservationDots({
  reservations,
}: {
  reservations: EnrichedReservation[]
}) {
  if (reservations.length === 0) return null
  const visible = reservations.slice(0, 3)
  const overflow = reservations.length - visible.length

  return (
    <div className="mt-0.5 flex items-center justify-center gap-0.5">
      {visible.map((r, i) => (
        <span
          key={i}
          className={cn("size-1.5 rounded-full", DOT_CLASSES[r.status])}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[9px] leading-none text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}

function ReservationCard({
  reservation,
  onStatusClick,
}: {
  reservation: EnrichedReservation
  onStatusClick: (r: EnrichedReservation) => void
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="font-mono text-xs font-medium">
          {reservation.time}
        </span>
      </div>

      <Separator orientation="vertical" className="h-auto self-stretch" />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {reservation.clientName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {reservation.propertyTitle}
            </p>
            {reservation.propertyCity && (
              <p className="text-xs text-muted-foreground">
                {reservation.propertyCity}
              </p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80",
              RESERVATION_STATUS_CLASSES[reservation.status]
            )}
            title="Klikni da promeniš status"
            onClick={() => onStatusClick(reservation)}
          >
            {RESERVATION_STATUS_LABELS[reservation.status]}
          </span>
        </div>

        {reservation.notes && (
          <p className="line-clamp-1 text-xs text-muted-foreground italic">
            {reservation.notes}
          </p>
        )}

        <Link
          to={`/reservations/${reservation.id}`}
          className="inline-block text-xs text-primary hover:underline"
        >
          Otvori detalje →
        </Link>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const navigate = useNavigate()

  const [reservations, setReservations] = useState<EnrichedReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState("")

  const [statusTarget, setStatusTarget] = useState<EnrichedReservation | null>(
    null
  )
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(
    null
  )
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      reservationsService.getAll(),
      clientsService.getAll(),
      propertiesService.getAll(),
    ])
      .then(([resData, clientData, propData]) => {
        const clientMap: Record<string, Client> = {}
        const propMap: Record<string, Property> = {}
        clientData.forEach((c) => {
          clientMap[c.id] = c
        })
        propData.forEach((p) => {
          propMap[p.id] = p
        })

        const enriched: EnrichedReservation[] = resData.map((r) => ({
          ...r,
          clientName: clientMap[r.clientId]?.name ?? "—",
          propertyTitle: propMap[r.propertyId]?.title ?? "Obrisana nekretnina",
          propertyCity: propMap[r.propertyId]?.city ?? "",
        }))

        setReservations(enriched)
      })
      .catch(() => toast.error("Greška pri učitavanju rezervacija."))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      reservations.filter((r) => !statusFilter || r.status === statusFilter),
    [reservations, statusFilter]
  )

  const byDate = useMemo(() => {
    const map: Record<string, EnrichedReservation[]> = {}
    filtered.forEach((r) => {
      if (!map[r.date]) map[r.date] = []
      map[r.date].push(r)
    })
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.time.localeCompare(b.time))
    )
    return map
  }, [filtered])

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const selectedDayItems = byDate[selectedDateStr] ?? []

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth]
  )

  function openStatusModal(r: EnrichedReservation) {
    setStatusTarget(r)
    setPendingStatus(r.status)
  }

  async function handleStatusChange() {
    if (!statusTarget || !pendingStatus) return
    setIsChangingStatus(true)
    try {
      await reservationsService.updateStatus(statusTarget.id, pendingStatus)
      setReservations((prev) =>
        prev.map((r) =>
          r.id === statusTarget.id ? { ...r, status: pendingStatus } : r
        )
      )
      toast.success("Status je promenjen.")
      setStatusTarget(null)
    } catch {
      toast.error("Greška pri promeni statusa.")
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kalendar obilazaka
          </h1>
          <p className="text-sm text-muted-foreground">
            Pregled zakazanih termina po danima
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || NO_FILTER}
            onValueChange={(v) => setStatusFilter(v === NO_FILTER ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Svi statusi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Svi statusi</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {RESERVATION_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => navigate("/reservations/create")} size="sm">
            <Plus className="mr-2 size-4" />
            Nova rezervacija
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const today = new Date()
                  setCurrentMonth(today)
                  setSelectedDate(today)
                }}
              >
                Danas
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd")
                const dayItems = byDate[dateStr] ?? []
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isCurrentDay = isToday(day)

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(day)
                      if (!isSameMonth(day, currentMonth)) {
                        setCurrentMonth(day)
                      }
                    }}
                    className={cn(
                      "relative flex min-h-15 flex-col items-center rounded-md px-1 py-1.5 text-sm transition-colors",
                      "hover:bg-accent",
                      !isCurrentMonth && "opacity-35",
                      isCurrentDay && !isSelected && "font-bold text-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-sm leading-none",
                        isCurrentDay &&
                          !isSelected &&
                          "bg-primary/10 font-bold text-primary"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    <ReservationDots
                      reservations={
                        isSelected
                          ? dayItems.map((r) => ({
                              ...r,
                              status: r.status,
                            }))
                          : dayItems
                      }
                    />

                    {dayItems.length > 3 && !isSelected && (
                      <span className="mt-0.5 text-[9px] text-muted-foreground">
                        {dayItems.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            <span className="text-xs text-muted-foreground">Legenda:</span>
            {STATUS_OPTIONS.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", DOT_CLASSES[s])} />
                <span className="text-xs text-muted-foreground">
                  {RESERVATION_STATUS_LABELS[s]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="space-y-0.5">
            <h3 className="font-semibold">
              {format(selectedDate, "EEEE, d. MMMM yyyy.")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDayItems.length > 0
                ? `${selectedDayItems.length} termin${selectedDayItems.length === 1 ? "" : "a"}`
                : "Nema termina"}
            </p>
          </div>

          <Separator />

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && selectedDayItems.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CalendarDays className="size-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">Nema obilazaka</p>
                <p className="text-xs text-muted-foreground">
                  {statusFilter
                    ? "Nema termina sa ovim statusom."
                    : "Nema zakazanih termina za ovaj dan."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/reservations/create?date=${format(selectedDate, "yyyy-MM-dd")}`
                  )
                }
              >
                <Plus className="mr-2 size-4" />
                Zakaži obilazak
              </Button>
            </div>
          )}

          {!isLoading && selectedDayItems.length > 0 && (
            <div className="max-h-130 space-y-2 overflow-y-auto pr-0.5">
              {selectedDayItems.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onStatusClick={openStatusModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!statusTarget}
        onOpenChange={(o) => {
          if (!o) setStatusTarget(null)
        }}
      >
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
              onClick={() => setStatusTarget(null)}
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
    </div>
  )
}
