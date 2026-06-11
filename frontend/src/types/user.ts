export interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
}

export type SafeUser = Omit<User, "password">
