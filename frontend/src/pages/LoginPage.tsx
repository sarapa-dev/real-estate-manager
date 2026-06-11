import { useState } from "react"
import { Navigate, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "../contexts/AuthContext"

const loginSchema = z.object({
  email: z
    .email({ error: "Email adresa nije ispravna." })
    .min(1, { error: "Email je obavezan." }),
  password: z.string().min(1, { error: "Lozinka je obavezna." }),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async ({ email, password }: LoginFormData) => {
    setServerError("")
    try {
      await login(email, password)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Došlo je do greške. Pokušajte ponovo."
      )
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            Nova Nekretnina
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Dobrodošli nazad
              </h1>
              <p className="text-sm text-muted-foreground">
                Prijavite se u agentski panel
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email adresa</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@agencija.rs"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Prijavljivanje...
                  </span>
                ) : (
                  "Prijavi se"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden bg-zinc-900 lg:block">
        <img
          src="https://picsum.photos/seed/realestate/1200/900"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
      </div>
    </div>
  )
}
