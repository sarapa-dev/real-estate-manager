import { useAuth } from "../contexts/AuthContext"

// Placeholder for now...
export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Dobrodošli,{" "}
        <span className="font-medium text-foreground">{user?.name}</span>
      </p>
    </div>
  )
}
