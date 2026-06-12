import type {
  Property,
  PropertyFilters,
  SortField,
  SortDirection,
} from "../types/property"

// One place to change Serbian labels for the whole app

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Stan",
  house: "Kuća",
  local: "Lokal",
  plot: "Plac",
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  active: "Aktivna",
  reserved: "Rezervisana",
  sold: "Prodata",
  rented: "Izdata",
}

export const PROPERTY_STATUS_CLASSES: Record<string, string> = {
  active:
    "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  reserved:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sold: "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-400",
  rented:
    "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
}

export const PROPERTY_PURPOSE_LABELS: Record<string, string> = {
  sale: "Prodaja",
  rent: "Izdavanje",
}

export const FEATURE_LABELS: Record<string, string> = {
  parking: "Parking",
  terrace: "Terasa",
  elevator: "Lift",
  furnished: "Namešteno",
  central_heating: "Centralno grejanje",
  new_build: "Novogradnja",
}

export const CITIES = [
  "Beograd",
  "Novi Sad",
  "Niš",
  "Kragujevac",
  "Subotica",
  "Kopaonik",
]

export const ROOMS_OPTIONS = [
  { value: "0.5", label: "Garsonjera" },
  { value: "1", label: "1.0" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
  { value: "2.5", label: "2.5" },
  { value: "3", label: "3.0" },
  { value: "4", label: "4+" },
]

export function formatPrice(
  price: number,
  currency: string,
  purpose: string
): string {
  const formatted = new Intl.NumberFormat("de-DE").format(price)
  return purpose === "rent"
    ? `${formatted} ${currency}/mes`
    : `${formatted} ${currency}`
}

export function formatRooms(rooms: number | null): string {
  if (rooms === null) return "-"
  if (rooms === 0.5) return "Garsonjera"
  if (rooms >= 4) return "4+"
  return String(rooms)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function applyFilters(
  properties: Property[],
  filters: PropertyFilters
): Property[] {
  const {
    search,
    city,
    type,
    purpose,
    status,
    priceFrom,
    priceTo,
    squareMetersFrom,
    rooms,
  } = filters

  return properties.filter((p) => {
    if (search) {
      const q = search.toLowerCase()
      const hit =
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      if (!hit) return false
    }

    if (city && p.city !== city) return false
    if (type && p.type !== type) return false
    if (purpose && p.purpose !== purpose) return false
    if (status && p.status !== status) return false

    if (priceFrom && p.price < Number(priceFrom)) return false
    if (priceTo && p.price > Number(priceTo)) return false
    if (squareMetersFrom && p.squareMeters < Number(squareMetersFrom))
      return false

    if (rooms) {
      const r = Number(rooms)
      // "4" option means "4 or more"
      if (r >= 4) {
        if (p.rooms === null || p.rooms < 4) return false
      } else {
        if (p.rooms !== r) return false
      }
    }

    return true
  })
}

export function applySorting(
  properties: Property[],
  field: SortField,
  direction: SortDirection
): Property[] {
  return [...properties].sort((a, b) => {
    let diff = 0
    if (field === "price") diff = a.price - b.price
    if (field === "squareMeters") diff = a.squareMeters - b.squareMeters
    if (field === "createdAt")
      diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return direction === "asc" ? diff : -diff
  })
}
