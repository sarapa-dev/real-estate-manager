import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Plus,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

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

import PropertyStatusBadge from "../components/properties/PropertyStatusBadge"
import { useProperties } from "../hooks/useProperties"
import {
  applyFilters,
  applySorting,
  formatPrice,
  PROPERTY_TYPE_LABELS,
  PROPERTY_PURPOSE_LABELS,
  CITIES,
  ROOMS_OPTIONS,
} from "../lib/propertyUtils"
import type {
  PropertyFilters,
  SortField,
  SortDirection,
} from "../types/property"

const PER_PAGE = 10

const DEFAULT_FILTERS: PropertyFilters = {
  search: "",
  city: "",
  type: "",
  purpose: "",
  status: "",
  priceFrom: "",
  priceTo: "",
  squareMetersFrom: "",
  rooms: "",
}

// Radix UI Select (used by shadcn) does not allow empty string as a value.
// We use this sentinel to represent "no filter selected" in the Select component
// while keeping empty string as the actual filter value in state.
const NO_FILTER = "_"
const toSel = (v: string) => v || NO_FILTER // state → Select value
const fromSel = (v: string) => (v === NO_FILTER ? "" : v) // Select value → state

export default function PropertiesPage() {
  const navigate = useNavigate()
  const { properties, isLoading, error, refetch, removeProperty } =
    useProperties()

  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ─── Derived data ──────────────────────────────────────────────
  const filtered = useMemo(
    () => applySorting(applyFilters(properties, filters), sortField, sortDir),
    [properties, filters, sortField, sortDir]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  )
  const hasFilters = Object.values(filters).some(Boolean)

  function updateFilter<K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await removeProperty(deleteId)
      toast.success("Nekretnina je uspešno obrisana.")
    } catch {
      toast.error("Greška pri brisanju. Pokušajte ponovo.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 inline size-3.5 opacity-40" />
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline size-3.5" />
    ) : (
      <ArrowDown className="ml-1 inline size-3.5" />
    )
  }

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter((p) => Math.abs(p - currentPage) <= 2)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nekretnine</h1>
          <p className="text-sm text-muted-foreground">
            Upravljajte listingima agencije
          </p>
        </div>
        <Button onClick={() => navigate("/properties/create")}>
          <Plus className="mr-2 size-4" />
          Dodaj nekretninu
        </Button>
      </div>

      {/* ── Filter panel ── */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Filteri</h3>

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <X className="size-4" />
              Resetuj
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pretraži po nazivu, adresi ili gradu..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            value={toSel(filters.city)}
            onValueChange={(v) => updateFilter("city", fromSel(v))}
          >
            <SelectTrigger className="w-full">
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

          <Select
            value={toSel(filters.type)}
            onValueChange={(v) => updateFilter("type", fromSel(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Svi tipovi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Svi tipovi</SelectItem>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={toSel(filters.purpose)}
            onValueChange={(v) => updateFilter("purpose", fromSel(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Namena" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Sve namene</SelectItem>
              {Object.entries(PROPERTY_PURPOSE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={toSel(filters.status)}
            onValueChange={(v) => updateFilter("status", fromSel(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Svi statusi</SelectItem>
              <SelectItem value="active">Aktivna</SelectItem>
              <SelectItem value="reserved">Rezervisana</SelectItem>
              <SelectItem value="sold">Prodata</SelectItem>
              <SelectItem value="rented">Izdata</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            type="number"
            placeholder="Cena od"
            min={0}
            value={filters.priceFrom}
            onChange={(e) => updateFilter("priceFrom", e.target.value)}
          />

          <Input
            type="number"
            placeholder="Cena do"
            min={0}
            value={filters.priceTo}
            onChange={(e) => updateFilter("priceTo", e.target.value)}
          />

          <Input
            type="number"
            placeholder="Kvadratura od"
            min={0}
            value={filters.squareMetersFrom}
            onChange={(e) => updateFilter("squareMetersFrom", e.target.value)}
          />

          <Select
            value={toSel(filters.rooms)}
            onValueChange={(v) => updateFilter("rooms", fromSel(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Broj soba" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>Sve sobe</SelectItem>
              {ROOMS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-44" />
          ) : (
            <>
              Prikazano{" "}
              <span className="font-medium text-foreground">
                {paginated.length}
              </span>{" "}
              od{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              nekretnina
            </>
          )}
        </span>

        <div className="flex items-center gap-0.5">
          <span className="mr-1 text-muted-foreground">Sortiraj:</span>
          {(["price", "createdAt", "squareMeters"] as SortField[]).map(
            (field) => (
              <Button
                key={field}
                variant="ghost"
                size="sm"
                onClick={() => handleSort(field)}
                className={sortField === field ? "" : "text-muted-foreground"}
              >
                {
                  { price: "Cena", createdAt: "Datum", squareMeters: "m²" }[
                    field
                  ]
                }
                <SortIcon field={field} />
              </Button>
            )
          )}
        </div>
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
                <TableHead className="w-16">Slika</TableHead>
                <TableHead>Naziv</TableHead>
                <TableHead>Lokacija</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>m²</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* ── Loading state ── */}
              {isLoading &&
                Array.from({ length: 7 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-14 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-52" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}

              {/* ── Empty state ── */}
              {!isLoading && paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground"
                  >
                    {hasFilters ? (
                      <div className="space-y-2">
                        <p>Nema rezultata za odabrane filtere.</p>
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
                        <p>Još uvek nema nekretnina.</p>
                        <Button
                          size="sm"
                          onClick={() => navigate("/properties/create")}
                        >
                          Dodaj prvu nekretninu
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                paginated.map((p) => (
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
                        className="block max-w-55 truncate font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {p.address}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm">
                      <div>{p.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.municipality}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {PROPERTY_TYPE_LABELS[p.type] ?? p.type}
                    </TableCell>

                    <TableCell className="text-sm">
                      {p.squareMeters} m²
                    </TableCell>

                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {formatPrice(p.price, p.currency, p.purpose)}
                    </TableCell>

                    <TableCell>
                      <PropertyStatusBadge status={p.status} />
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
                            onClick={() => navigate(`/properties/${p.id}`)}
                          >
                            <Eye className="mr-2 size-4" /> Detalji
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/properties/${p.id}/edit`)}
                          >
                            <Pencil className="mr-2 size-4" /> Izmeni
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => setDeleteId(p.id)}
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
            <AlertDialogTitle>Obrisati nekretninu?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija je nepovratna. Nekretnina će biti trajno uklonjena iz
              sistema.
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
