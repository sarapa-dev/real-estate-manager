import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { reservationsService } from "../services/reservationsService"
import type { Reservation, ReservationStatus } from "../types/reservation"

interface UseReservationReturn {
  reservation: Reservation | null
  isLoading: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
  updateStatus: (status: ReservationStatus) => Promise<void>
}

export function useReservation(id: string): UseReservationReturn {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const fetchReservation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await reservationsService.getById(id)
      setReservation(data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError("Greška pri učitavanju rezervacije.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchReservation()
  }, [fetchReservation])

  const updateStatus = async (status: ReservationStatus) => {
    await reservationsService.updateStatus(id, status)
    setReservation((prev) => (prev ? { ...prev, status } : null))
  }

  return {
    reservation,
    isLoading,
    error,
    notFound,
    refetch: fetchReservation,
    updateStatus,
  }
}
