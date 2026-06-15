import type { Client } from "../types/client"

export const INTEREST_TYPE_LABELS: Record<string, string> = {
  buy: "Kupovina",
  rent: "Izdavanje",
}

export const INTEREST_TYPE_CLASSES: Record<string, string> = {
  buy: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  rent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

export function formatBudget(from: number, to: number): string {
  const fmt = (n: number) => new Intl.NumberFormat("de-DE").format(n)
  return `${fmt(from)} – ${fmt(to)} EUR`
}

export interface ClientFilters {
  search: string
  interestType: string
  budgetFrom: string
  budgetTo: string
  city: string
}

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  search: "",
  interestType: "",
  budgetFrom: "",
  budgetTo: "",
  city: "",
}

export function applyClientFilters(
  clients: Client[],
  f: ClientFilters
): Client[] {
  return clients.filter((c) => {
    if (f.search) {
      const q = f.search.toLowerCase()
      const hit =
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      if (!hit) return false
    }

    if (f.interestType && c.interestType !== f.interestType) return false

    if (f.budgetFrom && c.budgetTo < Number(f.budgetFrom)) return false
    if (f.budgetTo && c.budgetFrom > Number(f.budgetTo)) return false

    if (f.city && !c.preferredCities.includes(f.city)) return false

    return true
  })
}
