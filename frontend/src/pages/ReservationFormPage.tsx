import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Building2, User } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { reservationsService } from "../services/reservationsService"
import { propertiesService } from "../services/propertiesService"
import { clientsService } from "../services/clientsService"
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_CLASSES,
} from "../lib/reservationUtils"
import { formatPrice } from "../lib/propertyUtils"
import type { Property } from "../types/property"
import type { Client } from "../types/client"
import type { ReservationStatus } from "../types/reservation"

const today = new Date().toISOString().split("T")[0]

const schema = z.object({
  propertyId: z.string().min(1, { error: "Nekretnina je obavezna." }),
  clientId: z.string().min(1, { error: "Klijent je obavezan." }),
  date: z
    .string()
    .min(1, { error: "Datum je obavezan." })
    .refine((d) => d >= today, { error: "Datum ne sme biti u prošlosti." }),
  time: z.string().min(1, { error: "Vreme je obavezno." }),
  status: z.enum(["new", "confirmed", "completed", "cancelled"] as const),
  notes: z.string().default(""),
})

type FormData = z.infer<typeof schema>

const NO_SEL = "__none__"
const toSel = (v: string) => v || NO_SEL
const fromSel = (v: string) => (v === NO_SEL ? "" : v)

const STATUS_OPTIONS: ReservationStatus[] = [
  "new",
  "confirmed",
  "completed",
  "cancelled",
]

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PropertyPreview({ property }: { property: Property }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
      <img
        src={property.imageUrl}
        alt={property.title}
        className="size-14 shrink-0 rounded object-cover"
        onError={(e) => {
          e.currentTarget.src =
            "https://placehold.co/56x56/e5e7eb/9ca3af?text=N/A"
        }}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{property.title}</p>
        <p className="text-xs text-muted-foreground">
          {property.city}, {property.municipality}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-primary">
          {formatPrice(property.price, property.currency, property.purpose)}
        </p>
      </div>
    </div>
  )
}

function ClientPreview({ client }: { client: Client }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="size-6 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{client.name}</p>
        <p className="text-xs text-muted-foreground">{client.phone}</p>
        <p className="truncate text-xs text-muted-foreground">{client.email}</p>
      </div>
    </div>
  )
}

export default function ReservationFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const prefilledPropertyId = searchParams.get("propertyId") ?? ""
  const prefilledClientId = searchParams.get("clientId") ?? ""

  const [properties, setProperties] = useState<Property[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  )
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      propertyId: prefilledPropertyId,
      clientId: prefilledClientId,
      date: "",
      time: "",
      status: "new",
      notes: "",
    },
  })

  useEffect(() => {
    Promise.all([propertiesService.getAll(), clientsService.getAll()])
      .then(([propertyData, clientData]) => {
        setProperties(propertyData)
        setClients(clientData)

        if (prefilledPropertyId) {
          const found = propertyData.find((p) => p.id === prefilledPropertyId)
          if (found) setSelectedProperty(found)
        }
        if (prefilledClientId) {
          const found = clientData.find((c) => c.id === prefilledClientId)
          if (found) setSelectedClient(found)
        }
      })
      .catch(() => toast.error("Greška pri učitavanju podataka."))
      .finally(() => setDataLoading(false))
  }, [prefilledPropertyId, prefilledClientId])

  const watchedPropertyId = watch("propertyId")
  const watchedClientId = watch("clientId")

  useEffect(() => {
    const found = properties.find((p) => p.id === watchedPropertyId) ?? null
    setSelectedProperty(found)
  }, [watchedPropertyId, properties])

  useEffect(() => {
    const found = clients.find((c) => c.id === watchedClientId) ?? null
    setSelectedClient(found)
  }, [watchedClientId, clients])

  async function isDuplicateBooking(
    propertyId: string,
    date: string,
    time: string
  ): Promise<boolean> {
    const existing = await reservationsService.getByPropertyId(propertyId)
    return existing.some(
      (r) => r.date === date && r.time === time && r.status !== "cancelled"
    )
  }

  async function onSubmit(data: FormData) {
    try {
      const duplicate = await isDuplicateBooking(
        data.propertyId,
        data.date,
        data.time
      )
      if (duplicate) {
        toast.error(
          "Za ovu nekretninu već postoji rezervacija u istom terminu."
        )
        return
      }

      await reservationsService.create({
        propertyId: data.propertyId,
        clientId: data.clientId,
        date: data.date,
        time: data.time,
        status: data.status,
        notes: data.notes,
      })

      toast.success("Rezervacija je uspešno kreirana.")

      if (prefilledPropertyId) {
        navigate(`/properties/${prefilledPropertyId}`)
      } else if (prefilledClientId) {
        navigate(`/clients/${prefilledClientId}`)
      } else {
        navigate("/reservations")
      }
    } catch {
      toast.error("Greška pri kreiranju rezervacije. Pokušajte ponovo.")
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/reservations" className="hover:text-foreground">
          Rezervacije
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Nova rezervacija</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova rezervacija</h1>
        <p className="text-sm text-muted-foreground">
          Zakažite obilazak nekretnine za klijenta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormSection title="Nekretnina">
          <Field
            label="Izaberite nekretninu"
            required
            error={errors.propertyId?.message}
          >
            <Controller
              name="propertyId"
              control={control}
              render={({ field }) => (
                <Select
                  value={toSel(field.value)}
                  onValueChange={(v) => field.onChange(fromSel(v))}
                  disabled={dataLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        dataLoading ? "Učitavanje..." : "Izaberite nekretninu"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {properties
                      .filter(
                        (p) =>
                          p.status === "active" || p.id === prefilledPropertyId
                      )
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="max-w-75 truncate">{p.title}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              — {p.city}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {selectedProperty && <PropertyPreview property={selectedProperty} />}
        </FormSection>

        <FormSection title="Klijent">
          <Field
            label="Izaberite klijenta"
            required
            error={errors.clientId?.message}
          >
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select
                  value={toSel(field.value)}
                  onValueChange={(v) => field.onChange(fromSel(v))}
                  disabled={dataLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        dataLoading ? "Učitavanje..." : "Izaberite klijenta"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          {c.name}
                          <span className="text-xs text-muted-foreground">
                            — {c.phone}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {selectedClient && <ClientPreview client={selectedClient} />}
        </FormSection>

        <FormSection title="Termin obilaska">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Datum" required error={errors.date?.message}>
              <Input type="date" min={today} {...register("date")} />
            </Field>
            <Field label="Vreme" required error={errors.time?.message}>
              <Input type="time" {...register("time")} />
            </Field>
          </div>

          <Field label="Status" error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => field.onChange(status)}
                      className={cn(
                        "flex items-center justify-center rounded-md border px-3 py-2 text-xs transition-colors",
                        field.value === status
                          ? "border-primary bg-primary/5 font-semibold"
                          : "hover:bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          RESERVATION_STATUS_CLASSES[status]
                        )}
                      >
                        {RESERVATION_STATUS_LABELS[status]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>
        </FormSection>

        <FormSection title="Napomena">
          <Field label="Napomena agenta" error={errors.notes?.message}>
            <Textarea
              placeholder="Posebni zahtevi klijenta, napomene za obilazak..."
              rows={3}
              {...register("notes")}
            />
          </Field>
        </FormSection>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Odustani
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || dataLoading}
            className="min-w-36"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Kreiranje...
              </span>
            ) : (
              "Zakaži obilazak"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
