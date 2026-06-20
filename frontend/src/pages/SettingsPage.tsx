import { useEffect, useRef, useState } from "react"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { settingsService, type SettingItem } from "../services/settingsService"

const COLOR_OPTIONS = [
  { value: "green", label: "Zelena", class: "bg-green-500" },
  { value: "yellow", label: "Žuta", class: "bg-yellow-500" },
  { value: "gray", label: "Siva", class: "bg-gray-400" },
  { value: "blue", label: "Plava", class: "bg-blue-500" },
  { value: "red", label: "Crvena", class: "bg-red-500" },
  { value: "purple", label: "Ljubičasta", class: "bg-purple-500" },
]

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ItemRow({
  item,
  displayText,
  badge,
  onDelete,
  isDefault,
}: {
  item: SettingItem
  displayText: string
  badge?: { label: string; color: string }
  onDelete: (id: string) => void
  isDefault?: boolean
}) {
  const colorClass: Record<string, string> = {
    green:
      "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
    yellow:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    gray: "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-400",
    blue: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
    red: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate text-sm font-medium">{displayText}</span>
        {badge && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
              colorClass[badge.color] ?? "bg-muted text-muted-foreground"
            )}
          >
            {badge.label}
          </span>
        )}
        {isDefault && (
          <span className="text-xs text-muted-foreground italic">
            (podrazumevano)
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDelete(item.id)}
        disabled={isDefault}
        title={isDefault ? "Sistemska vrednost se ne može obrisati" : "Obriši"}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

function CitiesTab() {
  const [cities, setCities] = useState<SettingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    settingsService
      .getCities()
      .then(setCities)
      .catch(() => toast.error("Greška pri učitavanju gradova."))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) {
      toast.error("Naziv grada ne sme biti prazan.")
      return
    }
    if (cities.some((c) => c.name?.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Grad sa ovim nazivom već postoji.")
      return
    }
    setIsAdding(true)
    try {
      const created = await settingsService.addCity(trimmed)
      setCities((prev) => [...prev, created])
      setNewName("")
      toast.success(`Grad "${trimmed}" je dodat.`)
      inputRef.current?.focus()
    } catch {
      toast.error("Greška pri dodavanju grada.")
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await settingsService.removeCity(deleteId)
      setCities((prev) => prev.filter((c) => c.id !== deleteId))
      toast.success("Grad je obrisan.")
    } catch {
      toast.error("Greška pri brisanju.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <SectionCard
      title="Gradovi"
      description="Lista gradova dostupnih u filterima i formama za nekretnine."
    >
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-2">
          {cities.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nema gradova.
            </p>
          ) : (
            cities.map((city) => (
              <ItemRow
                key={city.id}
                item={city}
                displayText={city.name ?? ""}
                onDelete={setDeleteId}
              />
            ))
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Input
          ref={inputRef}
          placeholder="Naziv novog grada"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          disabled={isAdding}
          className="max-w-xs"
        />
        <Button onClick={handleAdd} disabled={isAdding || !newName.trim()}>
          {isAdding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Plus className="mr-1.5 size-4" /> Dodaj
            </>
          )}
        </Button>
      </div>

      <DeleteConfirm
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null)
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        description="Grad će biti uklonjen iz svih filtera i formi."
      />
    </SectionCard>
  )
}

function PropertyTypesTab() {
  const [types, setTypes] = useState<SettingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newValue, setNewValue] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const DEFAULT_VALUES = ["apartment", "house", "local", "plot"]

  useEffect(() => {
    settingsService
      .getPropertyTypes()
      .then(setTypes)
      .catch(() => toast.error("Greška pri učitavanju tipova."))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleAdd() {
    const v = newValue.trim().toLowerCase().replace(/\s+/g, "_")
    const l = newLabel.trim()
    if (!v || !l) {
      toast.error("Popunite oba polja.")
      return
    }
    if (types.some((t) => t.value === v)) {
      toast.error("Tip sa ovim identifikatorom već postoji.")
      return
    }
    setIsAdding(true)
    try {
      const created = await settingsService.addPropertyType(v, l)
      setTypes((prev) => [...prev, created])
      setNewValue("")
      setNewLabel("")
      toast.success(`Tip "${l}" je dodat.`)
    } catch {
      toast.error("Greška pri dodavanju.")
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await settingsService.removePropertyType(deleteId)
      setTypes((prev) => prev.filter((t) => t.id !== deleteId))
      toast.success("Tip je obrisan.")
    } catch {
      toast.error("Greška pri brisanju.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <SectionCard
      title="Tipovi nekretnina"
      description="Stan, kuća, lokal, plac... Sistemske vrednosti se ne mogu brisati."
    >
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-2">
          {types.map((type) => (
            <ItemRow
              key={type.id}
              item={type}
              displayText={type.label ?? type.value ?? ""}
              onDelete={setDeleteId}
              isDefault={DEFAULT_VALUES.includes(type.value ?? "")}
            />
          ))}
        </div>
      )}

      <div className="space-y-2 pt-1">
        <Label className="text-xs text-muted-foreground">Dodaj novi tip</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Identifikator (npr. garage)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            disabled={isAdding}
            className="max-w-45"
          />
          <Input
            placeholder="Naziv (npr. Garaža)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
            }}
            disabled={isAdding}
            className="max-w-45"
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding || !newValue.trim() || !newLabel.trim()}
          >
            {isAdding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1.5 size-4" /> Dodaj
              </>
            )}
          </Button>
        </div>
      </div>

      <DeleteConfirm
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null)
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        description="Tip nekretnine će biti trajno uklonjen."
      />
    </SectionCard>
  )
}

function StatusTab({
  title,
  description,
  defaultValues,
  loadFn,
  addFn,
  removeFn,
}: {
  title: string
  description: string
  defaultValues: string[]
  loadFn: () => Promise<SettingItem[]>
  addFn: (value: string, label: string, color: string) => Promise<SettingItem>
  removeFn: (id: string) => Promise<void>
}) {
  const [items, setItems] = useState<SettingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newValue, setNewValue] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [newColor, setNewColor] = useState("blue")
  const [isAdding, setIsAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadFn()
      .then(setItems)
      .catch(() => toast.error("Greška pri učitavanju."))
      .finally(() => setIsLoading(false))
  }, [loadFn])

  async function handleAdd() {
    const v = newValue.trim().toLowerCase().replace(/\s+/g, "_")
    const l = newLabel.trim()
    if (!v || !l) {
      toast.error("Popunite sva polja.")
      return
    }
    if (items.some((i) => i.value === v)) {
      toast.error("Status sa ovim identifikatorom već postoji.")
      return
    }
    setIsAdding(true)
    try {
      const created = await addFn(v, l, newColor)
      setItems((prev) => [...prev, created])
      setNewValue("")
      setNewLabel("")
      setNewColor("blue")
      toast.success(`Status "${l}" je dodat.`)
    } catch {
      toast.error("Greška pri dodavanju.")
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await removeFn(deleteId)
      setItems((prev) => prev.filter((i) => i.id !== deleteId))
      toast.success("Status je obrisan.")
    } catch {
      toast.error("Greška pri brisanju.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <SectionCard title={title} description={description}>
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              displayText={item.label ?? item.value ?? ""}
              badge={{ label: item.label ?? "", color: item.color ?? "gray" }}
              onDelete={setDeleteId}
              isDefault={defaultValues.includes(item.value ?? "")}
            />
          ))}
        </div>
      )}

      <div className="space-y-2 pt-1">
        <Label className="text-xs text-muted-foreground">
          Dodaj novi status
        </Label>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Identifikator (npr. pending)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            disabled={isAdding}
            className="max-w-45"
          />
          <Input
            placeholder="Naziv (npr. Na čekanju)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
            }}
            disabled={isAdding}
            className="max-w-45"
          />

          <div className="flex items-center gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewColor(c.value)}
                title={c.label}
                className={cn(
                  "size-6 rounded-full transition-transform",
                  c.class,
                  newColor === c.value
                    ? "scale-110 ring-2 ring-foreground ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                )}
              />
            ))}
          </div>

          <Button
            onClick={handleAdd}
            disabled={isAdding || !newValue.trim() || !newLabel.trim()}
          >
            {isAdding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1.5 size-4" /> Dodaj
              </>
            )}
          </Button>
        </div>
      </div>

      <DeleteConfirm
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null)
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        description="Status će biti trajno uklonjen. Nekretnine/rezervacije koje ga koriste neće biti promenjene."
      />
    </SectionCard>
  )
}

function DeleteConfirm({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  description,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
  description: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Obrisati vrednost?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Odustani</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Brisanje..." : "Obriši"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Podešavanja</h1>
        <p className="text-sm text-muted-foreground">
          Upravljajte šifarnicima koji se koriste u filterima i formama.
        </p>
      </div>

      <Tabs defaultValue="cities">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="cities">Gradovi</TabsTrigger>
          <TabsTrigger value="propertyTypes">Tipovi nekretnina</TabsTrigger>
          <TabsTrigger value="propertyStatuses">Statusi nekretnina</TabsTrigger>
          <TabsTrigger value="reservationStatuses">
            Statusi rezervacija
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cities" className="mt-4">
          <CitiesTab />
        </TabsContent>

        <TabsContent value="propertyTypes" className="mt-4">
          <PropertyTypesTab />
        </TabsContent>

        <TabsContent value="propertyStatuses" className="mt-4">
          <StatusTab
            title="Statusi nekretnina"
            description="Aktivna, Rezervisana, Prodata, Izdata... Sistemske vrednosti se ne mogu brisati."
            defaultValues={["active", "reserved", "sold", "rented"]}
            loadFn={settingsService.getPropertyStatuses}
            addFn={settingsService.addPropertyStatus}
            removeFn={settingsService.removePropertyStatus}
          />
        </TabsContent>

        <TabsContent value="reservationStatuses" className="mt-4">
          <StatusTab
            title="Statusi rezervacija"
            description="Nova, Potvrđena, Obavljena, Otkazana... Sistemske vrednosti se ne mogu brisati."
            defaultValues={["new", "confirmed", "completed", "cancelled"]}
            loadFn={settingsService.getReservationStatuses}
            addFn={settingsService.addReservationStatus}
            removeFn={settingsService.removeReservationStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
