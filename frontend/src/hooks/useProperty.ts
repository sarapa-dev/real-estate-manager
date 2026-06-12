import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { propertiesService } from "../services/propertiesService"
import type { Property, PropertyStatus } from "../types/property"

interface UsePropertyReturn {
  property: Property | null
  isLoading: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
  updateStatus: (status: PropertyStatus) => Promise<void>
}

export function useProperty(id: string): UsePropertyReturn {
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const fetchProperty = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await propertiesService.getById(id)
      setProperty(data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError("Greška pri učitavanju nekretnine.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  const updateStatus = async (status: PropertyStatus) => {
    await propertiesService.update(id, { status })
    setProperty((prev) => (prev ? { ...prev, status } : null))
  }

  return {
    property,
    isLoading,
    error,
    notFound,
    refetch: fetchProperty,
    updateStatus,
  }
}
