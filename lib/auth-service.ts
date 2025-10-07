
import type { User } from "./types"

// Simulate current logged-in user
let currentUser: User | null = null

// Super Admin padrão do sistema (não depende da API)
export const SUPER_ADMIN: User = {
  id: 0,
  name: "Super Admin",
  email: "sup@sankhya.com.br",
  password: "SUP321", // Senha em texto plano apenas para validação
  role: "Administrador",
  status: "ativo",
  avatar: ""
}

export const authService = {
  // Login user
  async login(email: string, password: string): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return null;
      }

      const { user } = await response.json();
      
      if (user) {
        currentUser = user;
        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(user));
        }
        return user;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  // Get current logged-in user
  getCurrentUser(): User | null {
    if (!currentUser && typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser")
      if (stored) {
        currentUser = JSON.parse(stored)
      }
    }
    return currentUser
  },

  // Update current user profile
  async updateProfile(userData: Partial<User>): Promise<User | null> {
    if (!currentUser) return null

    try {
      const response = await fetch('/api/usuarios/salvar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentUser.id,
          ...userData
        }),
      });

      if (!response.ok) {
        return null;
      }

      const updatedUser = await response.json();

      if (updatedUser) {
        currentUser = updatedUser;
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        }
      }

      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  },

  // Logout user
  logout(): void {
    currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  },
}
