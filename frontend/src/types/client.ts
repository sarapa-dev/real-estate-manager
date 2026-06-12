export interface Client {
  id: string
  name: string
  email: string
  phone: string
  interestType: "buy" | "rent"
  budgetFrom: number
  budgetTo: number
  preferredCities: string[]
  notes: string
}
