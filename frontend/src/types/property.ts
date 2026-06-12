export type PropertyType = "apartment" | "house" | "local" | "plot"
export type PropertyPurpose = "sale" | "rent"
export type PropertyStatus = "active" | "reserved" | "sold" | "rented"

export interface PropertyAgent {
  name: string
  phone: string
  email: string
}

export interface Property {
  id: string
  title: string
  type: PropertyType
  purpose: PropertyPurpose
  status: PropertyStatus
  city: string
  municipality: string
  address: string
  price: number
  currency: string
  squareMeters: number
  rooms: number | null
  floor: number | null
  totalFloors: number | null
  yearBuilt: number | null
  imageUrl: string
  gallery: string[]
  features: string[]
  description: string
  agent: PropertyAgent
  createdAt: string
}

// Used for filter state
export interface PropertyFilters {
  search: string
  city: string
  type: string
  purpose: string
  status: string
  priceFrom: string
  priceTo: string
  squareMetersFrom: string
  rooms: string
}

export type SortField = "price" | "createdAt" | "squareMeters"
export type SortDirection = "asc" | "desc"
