"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/lib/users-service"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Omit<User, "id"> | User) => void
  user?: User | null
  mode: "create" | "edit"
}

export default function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Vendedor",
    status: "ativo" as "ativo" | "pendente" | "bloqueado",
    password: "",
  })

  useEffect(() => {
    if (user && mode === "edit") {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "Vendedor",
        status: "ativo",
        password: "",
      })
    }
  }, [user, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "edit" && user) {
      onSave({ ...user, ...formData })
    } else {
      onSave(formData)
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {mode === "create" ? "Cadastrar Usuário" : "Editar Usuário"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "edit" && (
            <div>
              <Label htmlFor="id" className="text-sm font-medium text-foreground">
                ID
              </Label>
              <Input id="id" type="text" value={user?.id || ""} disabled className="mt-1 bg-muted" />
            </div>
          )}

          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1"
              placeholder="Digite o nome completo"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-sm font-medium text-foreground">
              Função *
            </Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium text-foreground">
              Status *
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "ativo" | "pendente" | "bloqueado") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "create" && (
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={mode === "create"}
                className="mt-1"
                placeholder="Digite a senha"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              {mode === "create" ? "Cadastrar" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
