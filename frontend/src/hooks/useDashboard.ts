import { useCallback, useEffect, useState } from "react"
import { propertiesService } from "../services/propertiesService"
import { clientsService } from "../services/clientsService"
import { reservationsService } from "../services/reservationsService"
import type { Property } from "../types/property"
import type { Client } from "../types/client"
import type { Reservation } from "../types/reservation"

export interface DashboardStats {
  totalProperties: number
  activeProperties: number
  reservedProperties: number
  totalClients: number
  visitationsToday: number
}

export interface DashboardData {
  stats: DashboardStats
  recentReservations: Reservation[] // last 5 by createdAt
  recentProperties: Property[] // last 5 by createdAt
  clientMap: Record<string, Client>
  propertyMap: Record<string, Property>
  statusBreakdown: { status: string; count: number }[]
}

interface UseDashboardReturn {
  data: DashboardData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const todayStr = new Date().toISOString().split("T")[0]

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [properties, clients, reservations] = await Promise.all([
        propertiesService.getAll(),
        clientsService.getAll(),
        reservationsService.getAll(),
      ])

      const stats: DashboardStats = {
        totalProperties: properties.length,
        activeProperties: properties.filter((p) => p.status === "active")
          .length,
        reservedProperties: properties.filter((p) => p.status === "reserved")
          .length,
        totalClients: clients.length,
        visitationsToday: reservations.filter(
          (r) => r.date === todayStr && r.status !== "cancelled"
        ).length,
      }

      const recentReservations = [...reservations]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)

      const recentProperties = [...properties]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)

      const clientMap: Record<string, Client> = {}
      clients.forEach((c) => {
        clientMap[c.id] = c
      })

      const propertyMap: Record<string, Property> = {}
      properties.forEach((p) => {
        propertyMap[p.id] = p
      })

      const statusCounts: Record<string, number> = {}
      properties.forEach((p) => {
        statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1
      })
      const statusBreakdown = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count,
        })
      )

      setData({
        stats,
        recentReservations,
        recentProperties,
        clientMap,
        propertyMap,
        statusBreakdown,
      })
    } catch {
      setError("Greška pri učitavanju dashboard podataka.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, isLoading, error, refetch: fetchAll }
}
