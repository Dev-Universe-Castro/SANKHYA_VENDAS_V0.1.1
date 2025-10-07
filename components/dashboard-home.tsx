"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, TrendingUp, Activity } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Mock data for charts
const salesData = [
  { month: "Jan", vendas: 45, meta: 50 },
  { month: "Fev", vendas: 52, meta: 50 },
  { month: "Mar", vendas: 48, meta: 50 },
  { month: "Abr", vendas: 61, meta: 55 },
  { month: "Mai", vendas: 55, meta: 55 },
  { month: "Jun", vendas: 67, meta: 60 },
]

const activityData = [
  { dia: "Seg", parceiros: 12, usuarios: 8 },
  { dia: "Ter", parceiros: 15, usuarios: 11 },
  { dia: "Qua", parceiros: 8, usuarios: 6 },
  { dia: "Qui", parceiros: 18, usuarios: 14 },
  { dia: "Sex", parceiros: 22, usuarios: 17 },
  { dia: "Sáb", parceiros: 5, usuarios: 3 },
  { dia: "Dom", parceiros: 3, usuarios: 2 },
]

const recentActivities = [
  { id: 1, user: "Paulo Silva", action: "cadastrou novo parceiro", time: "há 5 min" },
  { id: 2, user: "Maria Santos", action: "atualizou dados de usuário", time: "há 15 min" },
  { id: 3, user: "João Costa", action: "realizou venda", time: "há 32 min" },
  { id: 4, user: "Ana Oliveira", action: "cadastrou novo usuário", time: "há 1 hora" },
  { id: 5, user: "Carlos Souza", action: "atualizou parceiro", time: "há 2 horas" },
]

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema Sankhya Força de Vendas</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Parceiros</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">248</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary">+12%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">89</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary">+8%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 145.2k</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary">+23%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">68.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary">+5.2%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Vendas vs Meta</CardTitle>
            <p className="text-sm text-muted-foreground">Comparativo dos últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" strokeWidth={2} name="Vendas" />
                <Line
                  type="monotone"
                  dataKey="meta"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Atividade Semanal</CardTitle>
            <p className="text-sm text-muted-foreground">Cadastros de parceiros e usuários</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Bar dataKey="parceiros" fill="hsl(var(--primary))" name="Parceiros" radius={[4, 4, 0, 0]} />
                <Bar dataKey="usuarios" fill="hsl(var(--accent))" name="Usuários" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Atividades Recentes</CardTitle>
          <p className="text-sm text-muted-foreground">Últimas ações realizadas no sistema</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
