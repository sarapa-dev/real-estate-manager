import { useCallback, useEffect, useState } from "react"
import { clientsService } from "../services/clientsService"
import type { Client } from "../types/client"

interface UseClientsReturn {
  clients: Client[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  removeClient: (id: string) => Promise<void>
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await clientsService.getAll()
      setClients(data)
    } catch {
      setError("Greška pri učitavanju klijenata.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const removeClient = async (id: string) => {
    await clientsService.remove(id)
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  return { clients, isLoading, error, refetch: fetchAll, removeClient }
}
