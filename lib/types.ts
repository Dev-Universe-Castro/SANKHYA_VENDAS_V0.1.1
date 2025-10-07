
export interface User {
  id: number
  name: string
  email: string
  role: string
  status: "ativo" | "pendente" | "bloqueado"
  password?: string
  avatar?: string
}
