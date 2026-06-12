import type { ReservationStatus } from "../types/reservation"

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  new: "Nova",
  confirmed: "Potvrđena",
  completed: "Obavljena",
  cancelled: "Otkazana",
}

export const RESERVATION_STATUS_CLASSES: Record<ReservationStatus, string> = {
  new: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  confirmed:
    "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  completed:
    "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-400",
  cancelled:
    "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
}
