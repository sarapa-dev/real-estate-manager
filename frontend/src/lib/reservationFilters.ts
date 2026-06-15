import type { Reservation } from "../types/reservation"

export interface ReservationFilters {
  status: string
  dateFrom: string
  dateTo: string
  search: string
  city: string
}

export const DEFAULT_RESERVATION_FILTERS: ReservationFilters = {
  status: "",
  dateFrom: "",
  dateTo: "",
  search: "",
  city: "",
}

export function applyReservationFilters(
  reservations: Reservation[],
  filters: ReservationFilters,
  clientMap: Record<string, string>, // id → name
  propertyMap: Record<string, { title: string; city: string }>
): Reservation[] {
  return reservations.filter((r) => {
    if (filters.status && r.status !== filters.status) return false

    if (filters.dateFrom && r.date < filters.dateFrom) return false
    if (filters.dateTo && r.date > filters.dateTo) return false

    if (filters.city) {
      const prop = propertyMap[r.propertyId]
      if (!prop || prop.city !== filters.city) return false
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      const clientName = (clientMap[r.clientId] ?? "").toLowerCase()
      const propTitle = (propertyMap[r.propertyId]?.title ?? "").toLowerCase()
      if (!clientName.includes(q) && !propTitle.includes(q)) return false
    }

    return true
  })
}
