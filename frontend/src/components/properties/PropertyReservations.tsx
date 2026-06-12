import { Link } from "react-router"
import { CalendarPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Reservation } from "../../types/reservation"
import type { Client } from "../../types/client"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../../lib/reservationUtils"
import { formatDate } from "../../lib/propertyUtils"

interface Props {
  propertyId: string
  reservations: Reservation[]
  clients: Record<string, Client>
  isLoading: boolean
}

export default function PropertyReservations({
  propertyId,
  reservations,
  clients,
  isLoading,
}: Props) {
  const scheduleUrl = `/reservations/create?propertyId=${propertyId}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Zakazani obilasci</h2>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {reservations.length > 0
                ? `${reservations.length} termin${reservations.length === 1 ? "" : "a"}`
                : "Još nema zakazanih termina"}
            </p>
          )}
        </div>
        <Button asChild size="sm">
          <Link to={scheduleUrl}>
            <CalendarPlus className="mr-2 size-4" />
            Zakaži obilazak
          </Link>
        </Button>
      </div>

      {/* Loading state*/}
      {isLoading && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {["Klijent", "Telefon", "Datum", "Vreme", "Status", ""].map(
                  (h) => (
                    <TableHead key={h}>{h}</TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && reservations.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Još uvek nema zakazanih obilazaka za ovu nekretninu.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link to={scheduleUrl}>Zakaži prvi obilazak</Link>
          </Button>
        </div>
      )}

      {!isLoading && reservations.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klijent</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Vreme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => {
                const client = clients[r.clientId]
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {client ? (
                        <Link
                          to={`/clients/${r.clientId}`}
                          className="hover:underline"
                        >
                          {client.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {client?.phone ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm">
                      {formatDate(r.date)}
                    </TableCell>

                    <TableCell className="text-sm">{r.time}</TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          RESERVATION_STATUS_CLASSES[r.status]
                        )}
                      >
                        {RESERVATION_STATUS_LABELS[r.status]}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/reservations/${r.id}`}>Detalji</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
