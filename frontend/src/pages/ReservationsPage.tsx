import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Plus,
  Search,
  X,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { useReservations } from "../hooks/useReservations"
import { clientsService } from "../services/clientsService"
import { propertiesService } from "../services/propertiesService"
import {
  applyReservationFilters,
  DEFAULT_RESERVATION_FILTERS,
  type ReservationFilters,
} from "../lib/reservationFilters"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../lib/reservationUtils"
import { formatDate, CITIES } from "../lib/propertyUtils"
import type { ReservationStatus } from "../types/reservation"
import type { Client } from "../types/client"
import type { Property } from "../types/property"

const PER_PAGE = 10
const NO_FILTER = "_"
const toSel = (v: string) => v || NO_FILTER
const fromSel = (v: string) => (v === NO_FILTER ? "" : v)

const STATUS_OPTIONS: ReservationStatus[] = [
  "new",
  "confirmed",
  "completed",
  "cancelled",
]

export default function ReservationsPage() {
  const navigate = useNavigate()
  const {
    reservations,
    isLoading,
    error,
    refetch,
    removeReservation,
    changeStatus,
  } = useReservations()

  const [clientMap, setClientMap] = useState<Record<string, string>>({})
  const [propertyMap, setPropertyMap] = useState<
    Record<string, { title: string; city: string }>
  >({})
  const [mapsLoading, setMapsLoading] = useState(true)

  useEffect(() => {
    Promise.all([clientsService.getAll(), propertiesService.getAll()])
      .then(([clients, properties]) => {
        const cm: Record<string, string> = {}
        clients.forEach((c: Client) => {
          cm[c.id] = c.name
        })

        const pm: Record<string, { title: string; city: string }> = {}
        properties.forEach((p: Property) => {
          pm[p.id] = { title: p.title, city: p.city }
        })

        setClientMap(cm)
        setPropertyMap(pm)
      })
      .catch(() => {})
      .finally(() => setMapsLoading(false))
  }, [])

  const [filters, setFilters] = useState<ReservationFilters>(
    DEFAULT_RESERVATION_FILTERS
  )
  const [currentPage, setCurrentPage] = useState(1)

  const [cancelId, setCancelId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(
    null
  )
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const filtered = applyReservationFilters(
    reservations,
    filters,
    clientMap,
    propertyMap
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  )
  const hasFilters = Object.values(filters).some(Boolean)

  // Handlers
  function updateFilter<K extends keyof ReservationFilters>(
    key: K,
    value: string
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function resetFilters() {
    setFilters(DEFAULT_RESERVATION_FILTERS)
    setCurrentPage(1)
  }

  async function handleCancel() {
    if (!cancelId) return
    setIsCancelling(true)
    try {
      await removeReservation(cancelId)
      toast.success("Rezervacija je otkazana.")
    } catch {
      toast.error("Greška pri otkazivanju. Pokušajte ponovo.")
    } finally {
      setIsCancelling(false)
      setCancelId(null)
    }
  }

  function openStatusModal(id: string, current: ReservationStatus) {
    setStatusModalId(id)
    setPendingStatus(current)
  }

  async function handleStatusChange() {
    if (!statusModalId || !pendingStatus) return
    setIsChangingStatus(true)
    try {
      await changeStatus(statusModalId, pendingStatus)
      toast.success("Status je promenjen.")
      setStatusModalId(null)
    } catch {
      toast.error("Greška pri promeni statusa.")
    } finally {
      setIsChangingStatus(false)
    }
  }

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter((p) => Math.abs(p - currentPage) <= 2)

  const combinedLoading = isLoading || mapsLoading

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rezervacije</h1>
          <p className="text-sm text-muted-foreground">
            Pregled svih zakazanih obilazaka nekretnina
          </p>
        </div>
        <Button onClick={() => navigate("/reservations/create")}>
          <Plus className="mr-2 size-4" />
          Nova rezervacija
        </Button>
      </div>

      {/* Filter panel */}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Filteri</span>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <X className="size-4" /> Resetuj
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pretraži po klijentu ili nekretnini..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select
            value={toSel(filters.status)}
            onValueChange={(v) => updateFilter("status", fromSel(v))}
          >
            <SelectTrigger>
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

          <Select
            value={toSel(filters.city)}
            onValueChange={(v) => updateFilter("city", fromSel(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Svi gradovi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Svi gradovi</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-0">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-0">
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {!combinedLoading && (
          <>
            Prikazano{" "}
            <span className="font-medium text-foreground">
              {paginated.length}
            </span>{" "}
            od{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            rezervacija
          </>
        )}
      </div>

      {error ? (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Pokušaj ponovo
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Klijent</TableHead>
                <TableHead>Nekretnina</TableHead>
                <TableHead>Datum / Vreme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kreirano</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedLoading &&
                Array.from({ length: 7 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!combinedLoading && paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
                    {hasFilters ? (
                      <div className="space-y-2">
                        <p>Nema rezervacija koje odgovaraju filterima.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                        >
                          Resetuj filtere
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>Još uvek nema rezervacija.</p>
                        <Button
                          size="sm"
                          onClick={() => navigate("/reservations/create")}
                        >
                          Zakaži prvu rezervaciju
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!combinedLoading &&
                paginated.map((r) => {
                  const clientName = clientMap[r.clientId]
                  const property = propertyMap[r.propertyId]
                  const isPast = new Date(`${r.date}T${r.time}`) < new Date()

                  return (
                    <TableRow
                      key={r.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        isPast && r.status === "new" && "opacity-60"
                      )}
                      onClick={() => navigate(`/reservations/${r.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{r.id}
                      </TableCell>

                      <TableCell className="font-medium">
                        {clientName ? (
                          <Link
                            to={`/clients/${r.clientId}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {clientName}
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
                            <span className="block text-xs font-normal text-muted-foreground">
                              {property.city}
                            </span>
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

                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Akcije</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/reservations/${r.id}`)}
                            >
                              <Eye className="mr-2 size-4" /> Detalji
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openStatusModal(r.id, r.status)}
                            >
                              <RefreshCw className="mr-2 size-4" /> Promeni
                              status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={r.status === "cancelled"}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setCancelId(r.id)}
                            >
                              <Ban className="mr-2 size-4" /> Otkaži
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!combinedLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Strana {currentPage} od {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!cancelId}
        onOpenChange={(open) => {
          if (!open) setCancelId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Otkazati rezervaciju?</AlertDialogTitle>
            <AlertDialogDescription>
              Status rezervacije će biti promenjen u "Otkazana". Ova akcija se
              može poništiti kasnijom promenom statusa.
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

      <Dialog
        open={!!statusModalId}
        onOpenChange={(open) => {
          if (!open) setStatusModalId(null)
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
              onClick={() => setStatusModalId(null)}
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
