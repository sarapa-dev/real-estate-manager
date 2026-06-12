import { useCallback, useEffect, useState } from "react"
import { propertiesService } from "../services/propertiesService"
import type { Property } from "../types/property"

interface UsePropertiesReturn {
  properties: Property[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  removeProperty: (id: string) => Promise<void>
}

export function useProperties(): UsePropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await propertiesService.getAll()
      setProperties(data)
    } catch {
      setError("Greška pri učitavanju nekretnina. Pokušajte ponovo.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const removeProperty = async (id: string) => {
    await propertiesService.remove(id)
    setProperties((prev) => prev.filter((p) => p.id !== id))
  }

  return { properties, isLoading, error, refetch: fetchAll, removeProperty }
}
