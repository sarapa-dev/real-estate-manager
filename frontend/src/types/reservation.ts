export type ReservationStatus = "new" | "confirmed" | "completed" | "cancelled"

export interface Reservation {
  id: string
  propertyId: string
  clientId: string
  date: string
  time: string
  status: ReservationStatus
  notes: string
  createdAt: string
}
