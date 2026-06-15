import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { clientsService } from "../services/clientsService"
import { CITIES } from "../lib/propertyUtils"

const schema = z.object({
  name: z.string().min(2, { error: "Ime mora imati najmanje 2 karaktera." }),
  email: z.email({ error: "Email adresa nije ispravna." }),
  phone: z.string().min(6, { error: "Broj telefona je obavezan." }),
  interestType: z.enum(["buy", "rent"] as const),
  budgetFrom: z.number({ error: "Unesite broj." }).min(0),
  budgetTo: z.number({ error: "Unesite broj." }).min(0),
  preferredCities: z.array(z.string()).default([]),
  notes: z.string().default(""),
})

type FormData = z.infer<typeof schema>

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

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-44 w-full rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}

export default function ClientFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [isLoadingClient, setIsLoadingClient] = useState(isEditMode)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // Explicit type-cast bypasses version conflicts between react-hook-form and zod packages
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      interestType: "buy",
      budgetFrom: 0,
      budgetTo: 0,
      preferredCities: [],
      notes: "",
    },
  })

  useEffect(() => {
    if (!isEditMode || !id) return

    clientsService
      .getById(id)
      .then((client) => {
        reset({
          name: client.name,
          email: client.email,
          phone: client.phone,
          interestType: client.interestType,
          budgetFrom: client.budgetFrom,
          budgetTo: client.budgetTo,
          preferredCities: client.preferredCities ?? [],
          notes: client.notes ?? "",
        })
      })
      .catch(() => toast.error("Greška pri učitavanju klijenta."))
      .finally(() => setIsLoadingClient(false))
  }, [id, isEditMode, reset])

  async function onSubmit(data: FormData) {
    try {
      if (isEditMode && id) {
        await clientsService.update(id, data)
        toast.success("Klijent je uspešno izmenjen.")
        navigate(`/clients/${id}`)
      } else {
        const created = await clientsService.create(data)
        toast.success("Klijent je uspešno dodat.")
        navigate(`/clients/${created.id}`)
      }
    } catch {
      toast.error("Greška pri čuvanju. Pokušajte ponovo.")
    }
  }

  if (isLoadingClient) return <FormSkeleton />

  const cancelPath = isEditMode ? `/clients/${id}` : "/clients"

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/clients" className="hover:text-foreground">
          Klijenti
        </Link>
        <span>/</span>
        {isEditMode && (
          <>
            <Link to={`/clients/${id}`} className="hover:text-foreground">
              Detalji
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-foreground">
          {isEditMode ? "Izmena" : "Novi klijent"}
        </span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditMode ? "Izmeni klijenta" : "Novi klijent"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Izmenite podatke i sačuvajte promene."
            : "Unesite podatke o novom klijentu."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormSection title="Kontakt podaci">
          <Field label="Ime i prezime" required error={errors.name?.message}>
            <Input placeholder="npr. Marko Marković" {...register("name")} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email adresa" required error={errors.email?.message}>
              <Input
                type="email"
                placeholder="marko@example.com"
                autoComplete="off"
                {...register("email")}
              />
            </Field>
            <Field label="Telefon" required error={errors.phone?.message}>
              <Input placeholder="+381601234567" {...register("phone")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Interesovanje i budžet">
          <Field
            label="Tip interesovanja"
            required
            error={errors.interestType?.message}
          >
            <Controller
              name="interestType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Kupovina</SelectItem>
                    <SelectItem value="rent">Izdavanje</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Budžet od (EUR)"
              required
              error={errors.budgetFrom?.message}
            >
              <Input
                type="number"
                min={0}
                placeholder="100000"
                {...register("budgetFrom", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Budžet do (EUR)"
              required
              error={errors.budgetTo?.message}
            >
              <Input
                type="number"
                min={0}
                placeholder="200000"
                {...register("budgetTo", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Preferirani gradovi">
          <Controller
            name="preferredCities"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CITIES.map((city) => {
                  const checked = field.value?.includes(city) ?? false
                  return (
                    <div key={city} className="flex items-center gap-2">
                      <Checkbox
                        id={`city-${city}`}
                        checked={checked}
                        onCheckedChange={(isChecked) => {
                          const current = field.value ?? []
                          field.onChange(
                            isChecked
                              ? [...current, city]
                              : current.filter((c) => c !== city)
                          )
                        }}
                      />
                      <label
                        htmlFor={`city-${city}`}
                        className="cursor-pointer text-sm select-none"
                      >
                        {city}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          />
        </FormSection>

        <FormSection title="Napomene">
          <Field label="Napomene agenta" error={errors.notes?.message}>
            <Textarea
              placeholder="Posebni zahtevi, preferencije, napomene o klijentu..."
              rows={4}
              {...register("notes")}
            />
          </Field>
        </FormSection>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(cancelPath)}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Odustani
          </Button>

          <Button type="submit" disabled={isSubmitting} className="min-w-28">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Čuvanje...
              </span>
            ) : isEditMode ? (
              "Sačuvaj izmene"
            ) : (
              "Dodaj klijenta"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
