import apiClient from "../services/apiClient"

export interface SettingItem {
  id: string
  name?: string
  value?: string
  label?: string
  color?: string
}

async function getAll(resource: string): Promise<SettingItem[]> {
  const { data } = await apiClient.get<SettingItem[]>(`/${resource}`)
  return data
}

async function create(
  resource: string,
  payload: Omit<SettingItem, "id">
): Promise<SettingItem> {
  const { data } = await apiClient.post<SettingItem>(`/${resource}`, payload)
  return data
}

async function remove(resource: string, id: string): Promise<void> {
  await apiClient.delete(`/${resource}/${id}`)
}

export const settingsService = {
  getCities: () => getAll("cities"),
  addCity: (name: string) => create("cities", { name }),
  removeCity: (id: string) => remove("cities", id),

  getPropertyTypes: () => getAll("propertyTypes"),
  addPropertyType: (value: string, label: string) =>
    create("propertyTypes", { value, label }),
  removePropertyType: (id: string) => remove("propertyTypes", id),

  getPropertyStatuses: () => getAll("propertyStatuses"),
  addPropertyStatus: (value: string, label: string, color: string) =>
    create("propertyStatuses", { value, label, color }),
  removePropertyStatus: (id: string) => remove("propertyStatuses", id),

  getReservationStatuses: () => getAll("reservationStatuses"),
  addReservationStatus: (value: string, label: string, color: string) =>
    create("reservationStatuses", { value, label, color }),
  removeReservationStatus: (id: string) => remove("reservationStatuses", id),
}
