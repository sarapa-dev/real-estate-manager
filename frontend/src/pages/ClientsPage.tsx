import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Plus,
  Search,
  X,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
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

import { useClients } from "../hooks/useClients"
import { reservationsService } from "../services/reservationsService"
import {
  applyClientFilters,
  formatBudget,
  INTEREST_TYPE_LABELS,
  INTEREST_TYPE_CLASSES,
  DEFAULT_CLIENT_FILTERS,
  type ClientFilters,
} from "../lib/clientUtils"
import { CITIES } from "../lib/propertyUtils"

const PER_PAGE = 10
const NO_FILTER = "_"
const toSel = (v: string) => v || NO_FILTER
const fromSel = (v: string) => (v === NO_FILTER ? "" : v)

export default function ClientsPage() {
  const navigate = useNavigate()
  const { clients, isLoading, error, refetch, removeClient } = useClients()

  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_CLIENT_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reservation count per client — fetched once, non-critical
  const [reservationCounts, setReservationCounts] = useState<
    Record<string, number>
  >({})

  useEffect(() => {
    reservationsService
      .getAll()
      .then((reservations) => {
        const counts: Record<string, number> = {}
        reservations.forEach((r) => {
          counts[r.clientId] = (counts[r.clientId] ?? 0) + 1
        })
        setReservationCounts(counts)
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(
    () => applyClientFilters(clients, filters),
    [clients, filters]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  )
  const hasFilters = Object.values(filters).some(Boolean)

  function updateFilter<K extends keyof ClientFilters>(key: K, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function resetFilters() {
    setFilters(DEFAULT_CLIENT_FILTERS)
    setCurrentPage(1)
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await removeClient(deleteId)
      toast.success("Klijent je uspešno obrisan.")
    } catch {
      toast.error("Greška pri brisanju. Pokušajte ponovo.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter((p) => Math.abs(p - currentPage) <= 2)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Klijenti</h1>
          <p className="text-sm text-muted-foreground">
            Upravljajte bazom klijenata agencije
          </p>
        </div>
        <Button onClick={() => navigate("/clients/create")}>
          <Plus className="mr-2 size-4" />
          Dodaj klijenta
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
            placeholder="Pretraži po imenu, telefonu ili emailu..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={toSel(filters.interestType)}
            onValueChange={(v) => updateFilter("interestType", fromSel(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Interesovanje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Sva interesovanja</SelectItem>
              <SelectItem value="buy">Kupovina</SelectItem>
              <SelectItem value="rent">Izdavanje</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={toSel(filters.city)}
            onValueChange={(v) => updateFilter("city", fromSel(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Grad" />
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

          <Input
            type="number"
            placeholder="Budžet od"
            min={0}
            value={filters.budgetFrom}
            onChange={(e) => updateFilter("budgetFrom", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Budžet do"
            min={0}
            value={filters.budgetTo}
            onChange={(e) => updateFilter("budgetTo", e.target.value)}
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {!isLoading && (
          <>
            Prikazano{" "}
            <span className="font-medium text-foreground">
              {paginated.length}
            </span>{" "}
            od{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            klijenata
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
                <TableHead>Ime i prezime</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Interesovanje</TableHead>
                <TableHead>Budžet</TableHead>
                <TableHead>Rezervacije</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
                    {hasFilters ? (
                      <div className="space-y-2">
                        <p>Nema klijenata koji odgovaraju filterima.</p>
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
                        <p>Još uvek nema klijenata.</p>
                        <Button
                          size="sm"
                          onClick={() => navigate("/clients/create")}
                        >
                          Dodaj prvog klijenta
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                paginated.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        to={`/clients/${c.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.name}
                      </Link>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {c.phone}
                    </TableCell>

                    <TableCell className="max-w-45 truncate text-sm text-muted-foreground">
                      {c.email}
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          INTEREST_TYPE_CLASSES[c.interestType]
                        )}
                      >
                        {INTEREST_TYPE_LABELS[c.interestType]}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm whitespace-nowrap">
                      {formatBudget(c.budgetFrom, c.budgetTo)}
                    </TableCell>

                    <TableCell className="text-center text-sm">
                      {reservationCounts[c.id] ?? 0}
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
                            onClick={() => navigate(`/clients/${c.id}`)}
                          >
                            <Eye className="mr-2 size-4" /> Detalji
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/clients/${c.id}/edit`)}
                          >
                            <Pencil className="mr-2 size-4" /> Izmeni
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="mr-2 size-4" /> Obriši
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && totalPages > 1 && (
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
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati klijenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija je nepovratna. Klijent i sve vezane rezervacije biće
              trajno obrisani.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Odustani
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Brisanje..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
