import apiClient from "./apiClient"
import type { Reservation, ReservationStatus } from "../types/reservation"

export type CreateReservationData = Omit<Reservation, "id" | "createdAt">

export const reservationsService = {
  async getAll(): Promise<Reservation[]> {
    const { data } = await apiClient.get<Reservation[]>("/reservations")
    return data
  },

  async getByPropertyId(propertyId: string): Promise<Reservation[]> {
    const { data } = await apiClient.get<Reservation[]>("/reservations", {
      params: { propertyId },
    })
    return data
  },

  async getByClientId(clientId: string): Promise<Reservation[]> {
    const { data } = await apiClient.get<Reservation[]>("/reservations", {
      params: { clientId },
    })
    return data
  },

  async getById(id: string): Promise<Reservation> {
    const { data } = await apiClient.get<Reservation>(`/reservations/${id}`)
    return data
  },

  async create(reservation: CreateReservationData): Promise<Reservation> {
    const { data } = await apiClient.post<Reservation>("/reservations", {
      ...reservation,
      createdAt: new Date().toISOString(),
    })
    return data
  },

  async update(
    id: string,
    payload: Partial<Reservation>
  ): Promise<Reservation> {
    const { data } = await apiClient.put<Reservation>(
      `/reservations/${id}`,
      payload
    )
    return data
  },

  async updateStatus(
    id: string,
    status: ReservationStatus
  ): Promise<Reservation> {
    const { data } = await apiClient.patch<Reservation>(`/reservations/${id}`, {
      status,
    })
    return data
  },
}
