import apiClient from "./apiClient"
import type { Client } from "../types/client"

export type CreateClientData = Omit<Client, "id">

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const { data } = await apiClient.get<Client[]>("/clients")
    return data
  },

  async getById(id: string): Promise<Client> {
    const { data } = await apiClient.get<Client>(`/clients/${id}`)
    return data
  },

  async create(client: CreateClientData): Promise<Client> {
    const { data } = await apiClient.post<Client>("/clients", client)
    return data
  },

  async update(id: string, client: Partial<Client>): Promise<Client> {
    const { data } = await apiClient.put<Client>(`/clients/${id}`, client)
    return data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`)
  },
}
