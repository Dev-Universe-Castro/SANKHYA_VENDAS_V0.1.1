"use client"

import { useState, useEffect } from "react"
import { Search, Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usersService, type User } from "@/lib/users-service"
import UserModal from "./user-modal"
import { Badge } from "@/components/ui/badge"

export default function UsersTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserRole] = useState("Administrador")

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await usersService.getAll()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await usersService.delete(id)
        await loadUsers()
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await usersService.approve(id)
      await loadUsers()
    } catch (error) {
      console.error("Error approving user:", error)
    }
  }

  const handleBlock = async (id: number) => {
    if (confirm("Tem certeza que deseja bloquear este usuário?")) {
      try {
        await usersService.block(id)
        await loadUsers()
      } catch (error) {
        console.error("Error blocking user:", error)
      }
    }
  }

  const handleSave = async (userData: Omit<User, "id"> | User) => {
    try {
      if (modalMode === "edit" && "id" in userData) {
        await usersService.update(userData.id, userData)
      } else {
        await usersService.create(userData as Omit<User, "id">)
      }
      await loadUsers()
    } catch (error) {
      console.error("Error saving user:", error)
    }
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
      case "pendente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>
      case "bloqueado":
        return <Badge className="bg-red-500 hover:bg-red-600">Bloqueado</Badge>
    }
  }

  const isAdmin = currentUserRole === "Administrador"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        {isAdmin && (
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase"
          >
            Cadastrar
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary">
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{user.id}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{user.role}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(user.status)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.status === "pendente" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(user.id)}
                                className="bg-green-500 hover:bg-green-600 text-white font-medium uppercase text-xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleBlock(user.id)}
                                className="bg-red-500 hover:bg-red-600 text-white font-medium uppercase text-xs flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Bloquear
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleEdit(user)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase text-xs flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Editar
                              </Button>
                              {user.status === "ativo" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleBlock(user.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white font-medium uppercase text-xs flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Bloquear
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(user.id)}
                                className="font-medium uppercase text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isAdmin && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          user={selectedUser}
          mode={modalMode}
        />
      )}
    </div>
  )
}
