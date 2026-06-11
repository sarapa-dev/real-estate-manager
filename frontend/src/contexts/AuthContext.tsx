import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import apiClient from "../services/apiClient"
import type { User, SafeUser } from "../types/user"

interface AuthContextValue {
  user: SafeUser | null
  login: (email: string, password: string) => Promise<SafeUser>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_STORAGE_KEY = "auth_user"
const TOKEN_STORAGE_KEY = "auth_token"

function getStoredUser(): SafeUser | null {
  const saved = localStorage.getItem(USER_STORAGE_KEY)

  if (!saved) return null

  try {
    return JSON.parse(saved) as SafeUser
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredUser())
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<SafeUser> => {
    const { data } = await apiClient.get<User[]>("/users", {
      params: { email },
    })

    const matchedUser = data.find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password === password
    )

    if (!matchedUser) {
      throw new Error("Pogrešan email ili lozinka.")
    }

    const { password: _password, ...safeUser } = matchedUser

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser))
    localStorage.setItem(TOKEN_STORAGE_KEY, "mock-token")

    setUser(safeUser)

    return safeUser
  }

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)

    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    login,
    logout,
    isAuthenticated: user !== null,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
