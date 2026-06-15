import { useCallback, useEffect, useState } from "react"
import { reservationsService } from "../services/reservationsService"
import type { Reservation, ReservationStatus } from "../types/reservation"

interface UseReservationsReturn {
  reservations: Reservation[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  removeReservation: (id: string) => Promise<void>
  changeStatus: (id: string, status: ReservationStatus) => Promise<void>
}

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reservationsService.getAll()
      const sorted = [...data].sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
      )
      setReservations(sorted)
    } catch {
      setError("Greška pri učitavanju rezervacija.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const removeReservation = async (id: string) => {
    await reservationsService.update(id, { status: "cancelled" })
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
    )
  }

  const changeStatus = async (id: string, status: ReservationStatus) => {
    await reservationsService.updateStatus(id, status)
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    )
  }

  return {
    reservations,
    isLoading,
    error,
    refetch: fetchAll,
    removeReservation,
    changeStatus,
  }
}
