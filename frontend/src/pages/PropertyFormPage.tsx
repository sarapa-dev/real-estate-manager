import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Plus } from "lucide-react"

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

import { propertiesService } from "../services/propertiesService"
import { useAuth } from "../contexts/AuthContext"
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  FEATURE_LABELS,
  CITIES,
  ROOMS_OPTIONS,
} from "../lib/propertyUtils"

// Converts empty string / null / undefined → null for optional number inputs.
const optionalNum = z.preprocess((v) => {
  if (v === "" || v == null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}, z.number().nullable().default(null))

const schema = z.object({
  title: z
    .string()
    .min(3, { message: "Naziv mora imati najmanje 3 karaktera." }),
  type: z.enum(["apartment", "house", "local", "plot"] as const),
  purpose: z.enum(["sale", "rent"] as const),
  status: z.enum(["active", "reserved", "sold", "rented"] as const),

  city: z.string().min(1, { message: "Grad je obavezan." }),
  municipality: z.string().default(""),
  address: z.string().min(1, { message: "Adresa je obavezna." }),

  squareMeters: z.coerce
    .number()
    .positive({ message: "Kvadratura mora biti veća od 0." }),
  rooms: optionalNum,
  floor: optionalNum,
  totalFloors: optionalNum,
  yearBuilt: optionalNum,

  price: z.coerce.number().positive({ message: "Cena mora biti veća od 0." }),
  currency: z.string().default("EUR"),

  imageUrl: z.string().default(""),
  gallery: z.array(z.string().default("")).default(["", "", ""]),

  description: z
    .string()
    .default("")
    .refine((s) => s.length === 0 || s.length >= 20, {
      message: "Opis mora imati najmanje 20 karaktera.",
    }),

  features: z.array(z.string()).default([]),
})

type FormData = z.infer<typeof schema>

const SEL_NONE = "__none__"
const toSel = (v: string | undefined | null) => v || SEL_NONE
const fromSel = (v: string) => (v === SEL_NONE ? "" : v)

const FEATURES = Object.entries(FEATURE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const PROPERTY_STATUSES = Object.entries(PROPERTY_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
)

const PROPERTY_TYPES = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
)

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
    <div className="space-y-5">
      <Skeleton className="h-7 w-52" />
      {[180, 140, 200, 120, 160, 100].map((h, i) => (
        <Skeleton key={i} className={`h-[${h}px] w-full rounded-lg`} />
      ))}
    </div>
  )
}

export default function PropertyFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = !!id

  const [isLoadingProperty, setIsLoadingProperty] = useState(isEditMode)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // Explicit type-casting overrides version mismatch issues between Zod and React Hook Form
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      title: "",
      type: "apartment",
      purpose: "sale",
      status: "active",
      city: "",
      municipality: "",
      address: "",
      squareMeters: 0,
      rooms: null,
      floor: null,
      totalFloors: null,
      yearBuilt: null,
      price: 0,
      currency: "EUR",
      imageUrl: "",
      gallery: ["", "", ""],
      description: "",
      features: [],
    },
  })

  useEffect(() => {
    if (!isEditMode || !id) return

    propertiesService
      .getById(id)
      .then((property) => {
        const gallery = [...(property.gallery ?? []), "", "", ""].slice(
          0,
          3
        ) as [string, string, string]

        reset({
          title: property.title,
          type: property.type,
          purpose: property.purpose,
          status: property.status,
          city: property.city,
          municipality: property.municipality,
          address: property.address,
          squareMeters: property.squareMeters,
          rooms: property.rooms,
          floor: property.floor,
          totalFloors: property.totalFloors,
          yearBuilt: property.yearBuilt,
          price: property.price,
          currency: property.currency,
          imageUrl: property.imageUrl,
          gallery,
          description: property.description,
          features: property.features,
        })
      })
      .catch(() => toast.error("Greška pri učitavanju nekretnine."))
      .finally(() => setIsLoadingProperty(false))
  }, [id, isEditMode, reset])

  const watchedPrice = watch("price")
  const watchedSqm = watch("squareMeters")
  const pricePerM2 =
    watchedPrice > 0 && watchedSqm > 0
      ? Math.round(Number(watchedPrice) / Number(watchedSqm))
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      : null

  async function onSubmit(data: FormData) {
    const cleanGallery = (data.gallery ?? []).filter((u) => u.trim() !== "")

    const payload = {
      ...data,
      gallery: cleanGallery,
      agent: {
        name: user?.name ?? "Aleksandar Kovačević",
        phone: "+381631111111",
        email: user?.email ?? "agent@agencija.rs",
      },
    }

    try {
      if (isEditMode && id) {
        await propertiesService.update(id, payload)
        toast.success("Nekretnina je uspešno izmenjena.")
        navigate(`/properties/${id}`)
      } else {
        const created = await propertiesService.create(payload)
        toast.success("Nekretnina je uspešno dodata.")
        navigate(`/properties/${created.id}`)
      }
    } catch {
      toast.error("Greška pri čuvanju. Pokušajte ponovo.")
    }
  }

  if (isLoadingProperty) return <FormSkeleton />

  const cancelPath = isEditMode ? `/properties/${id}` : "/properties"

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/properties" className="hover:text-foreground">
          Nekretnine
        </Link>
        <span>/</span>
        {isEditMode && (
          <>
            <Link to={`/properties/${id}`} className="hover:text-foreground">
              Detalji
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-foreground">
          {isEditMode ? "Izmena" : "Nova nekretnina"}
        </span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditMode ? "Izmeni nekretninu" : "Nova nekretnina"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Izmenite podatke i sačuvajte promene."
            : "Popunite podatke o novoj nekretnini."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormSection title="Osnovni podaci">
          <Field
            label="Naziv nekretnine"
            required
            error={errors.title?.message}
          >
            <Input
              placeholder="npr. Dvosoban stan kod Hrama Svetog Save"
              {...register("title")}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tip nekretnine" required error={errors.type?.message}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Namena" required error={errors.purpose?.message}>
              <Controller
                name="purpose"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Prodaja</SelectItem>
                      <SelectItem value="rent">Izdavanje</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Status" required error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUSES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Lokacija">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Grad" required error={errors.city?.message}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select
                    value={toSel(field.value)}
                    onValueChange={(v) => field.onChange(fromSel(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite grad" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Opština" error={errors.municipality?.message}>
              <Input placeholder="npr. Vračar" {...register("municipality")} />
            </Field>
          </div>

          <Field label="Adresa" required error={errors.address?.message}>
            <Input placeholder="npr. Kursulina 12" {...register("address")} />
          </Field>
        </FormSection>

        <FormSection title="Karakteristike nekretnine">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              label="Kvadratura (m²)"
              required
              error={errors.squareMeters?.message}
            >
              <Input
                type="number"
                min={1}
                placeholder="58"
                {...register("squareMeters")}
              />
            </Field>

            <Field label="Broj soba" error={errors.rooms?.message}>
              <Controller
                name="rooms"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : SEL_NONE}
                    onValueChange={(v) =>
                      field.onChange(v === SEL_NONE ? null : Number(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEL_NONE}>—</SelectItem>
                      {ROOMS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Sprat" error={errors.floor?.message}>
              <Input
                type="number"
                min={0}
                placeholder="3"
                {...register("floor")}
              />
            </Field>

            <Field label="Ukupno spratova" error={errors.totalFloors?.message}>
              <Input
                type="number"
                min={1}
                placeholder="6"
                {...register("totalFloors")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Godina izgradnje" error={errors.yearBuilt?.message}>
              <Input
                type="number"
                min={1900}
                max={2030}
                placeholder="2018"
                {...register("yearBuilt")}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Finansije">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Cena" required error={errors.price?.message}>
                <Input
                  type="number"
                  min={1}
                  placeholder="185000"
                  {...register("price")}
                />
              </Field>
            </div>

            <Field label="Valuta" error={errors.currency?.message}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RSD">RSD</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          {pricePerM2 && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              Cena po m²:{" "}
              <span className="font-semibold">
                {pricePerM2} {watch("currency")}/m²
              </span>
            </div>
          )}
        </FormSection>

        <FormSection title="Slike">
          <Field label="URL glavne slike" error={errors.imageUrl?.message}>
            <Input placeholder="https://..." {...register("imageUrl")} />
          </Field>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              URL slike galerije (opciono, do 3)
            </Label>
            {[0, 1, 2].map((i) => (
              <Input
                key={i}
                placeholder={`URL slike ${i + 2}`}
                {...register(`gallery.${i}` as const)}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Opis">
          <Field label="Opis nekretnine" error={errors.description?.message}>
            <Textarea
              placeholder="Detaljno opišite nekretninu — lokacija, stanje, prednosti..."
              rows={5}
              {...register("description")}
            />
            <p className="pt-1 text-xs text-muted-foreground">
              Minimum 20 karaktera ako se popunjava.
            </p>
          </Field>
        </FormSection>

        <FormSection title="Dodatne karakteristike">
          <Controller
            name="features"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {FEATURES.map(({ value, label }) => {
                  const checked = field.value?.includes(value) ?? false
                  return (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`feat-${value}`}
                        checked={checked}
                        onCheckedChange={(isChecked) => {
                          const current = field.value ?? []
                          field.onChange(
                            isChecked
                              ? [...current, value]
                              : current.filter((v) => v !== value)
                          )
                        }}
                      />
                      <label
                        htmlFor={`feat-${value}`}
                        className="cursor-pointer text-sm select-none"
                      >
                        {label}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          />
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
              <span className="flex items-center gap-1.5">
                <Plus className="size-4" />
                Dodaj nekretninu
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
