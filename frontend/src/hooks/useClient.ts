import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { clientsService } from "../services/clientsService"
import type { Client } from "../types/client"

interface UseClientReturn {
  client: Client | null
  isLoading: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
}

export function useClient(id: string): UseClientReturn {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const fetchClient = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await clientsService.getById(id)
      setClient(data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError("Greška pri učitavanju klijenta.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  return { client, isLoading, error, notFound, refetch: fetchClient }
}
