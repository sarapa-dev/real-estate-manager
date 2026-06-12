import apiClient from "./apiClient"
import type { Property } from "../types/property"

export type CreatePropertyData = Omit<Property, "id" | "createdAt">
export type UpdatePropertyData = Partial<Omit<Property, "id">>

export const propertiesService = {
  async getAll(): Promise<Property[]> {
    const { data } = await apiClient.get<Property[]>("/properties")
    return data
  },

  async getById(id: string): Promise<Property> {
    const { data } = await apiClient.get<Property>(`/properties/${id}`)
    return data
  },

  async create(property: CreatePropertyData): Promise<Property> {
    const { data } = await apiClient.post<Property>("/properties", {
      ...property,
      createdAt: new Date().toISOString(),
    })
    return data
  },

  async update(id: string, property: UpdatePropertyData): Promise<Property> {
    const { data } = await apiClient.put<Property>(
      `/properties/${id}`,
      property
    )
    return data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`)
  },
}
