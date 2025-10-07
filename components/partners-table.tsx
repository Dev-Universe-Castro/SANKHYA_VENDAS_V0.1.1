"use client"

import { useState, useEffect } from "react"
import { Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PartnerModal } from "@/components/partner-modal"
import { useToast } from "@/hooks/use-toast"

interface Partner {
  _id: string
  CODPARC: string
  NOMEPARC: string
  CGC_CPF: string
  CODCID?: string
  ATIVO?: string
  TIPPESSOA?: string
}

interface PaginatedResponse {
  parceiros: Partner[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const ITEMS_PER_PAGE = 50

export default function PartnersTable() {
  const [searchName, setSearchName] = useState("")
  const [searchCode, setSearchCode] = useState("")
  const [appliedSearchName, setAppliedSearchName] = useState("")
  const [appliedSearchCode, setAppliedSearchCode] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const { toast } = useToast()

  // Carregar parceiros quando a página mudar ou quando os filtros mudarem
  useEffect(() => {
    loadPartners()
  }, [currentPage, appliedSearchName, appliedSearchCode])

  const handleSearch = () => {
    setAppliedSearchName(searchName)
    setAppliedSearchCode(searchCode)
    setCurrentPage(1) // Reset para primeira página ao buscar
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRecords)

  const loadPartners = async () => {
    try {
      setIsLoading(true)
      const url = `/api/sankhya/parceiros?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}&searchName=${encodeURIComponent(appliedSearchName)}&searchCode=${encodeURIComponent(appliedSearchCode)}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Falha ao carregar parceiros')
      }

      const data: PaginatedResponse = await response.json()
      setPartners(data.parceiros)
      setTotalPages(data.totalPages)
      setTotalRecords(data.total)

      if (currentPage === 1) {
        toast({
          title: "Sucesso",
          description: `${data.total} parceiros encontrados`,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar parceiros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (partner: any) => {
    // Garantir que o parceiro está completamente carregado antes de abrir
    setSelectedPartner(partner)
    requestAnimationFrame(() => {
      setIsModalOpen(true)
    })
  }

  const handleCreate = () => {
    setSelectedPartner(null)
    setIsModalOpen(true)
  }

  const handleSave = async (partnerData: { CODPARC?: string; NOMEPARC: string; CGC_CPF: string; CODCID: string; ATIVO: string; TIPPESSOA: string }) => {
    try {
      console.log("🔄 Frontend - Iniciando salvamento de parceiro:", partnerData);

      const response = await fetch('/api/sankhya/parceiros/salvar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnerData),
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Frontend - Erro na resposta da API:", errorData);
        throw new Error(errorData.error || 'Falha ao salvar parceiro')
      }

      const resultado = await response.json();

      console.log("✅ Frontend - Parceiro salvo com sucesso:", resultado);

      toast({
        title: "Sucesso",
        description: partnerData.CODPARC ? "Parceiro atualizado com sucesso" : "Parceiro cadastrado com sucesso",
      })
      await loadPartners()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("❌ Frontend - Erro ao salvar parceiro:", {
        message: error.message,
        dados: partnerData
      });

      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar parceiro",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Parceiros</h1>
        <Button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase"
        >
          Cadastrar
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por código do parceiro"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 bg-card"
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome da empresa"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 bg-card"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase"
        >
          Buscar
        </Button>
        {(appliedSearchName || appliedSearchCode) && (
          <Button
            onClick={() => {
              setSearchName("")
              setSearchCode("")
              setAppliedSearchName("")
              setAppliedSearchCode("")
              setCurrentPage(1)
            }}
            variant="outline"
            className="font-medium uppercase"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  CPF/CNPJ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Nenhum parceiro encontrado
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{partner.CODPARC}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{partner.NOMEPARC}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{partner.CGC_CPF}</td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(partner)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase text-xs flex items-center gap-2"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && partners.length > 0 && (
        <div className="flex items-center justify-between bg-card rounded-lg shadow px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {endIndex} de {totalRecords} parceiros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <PartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partner={selectedPartner}
        onSave={handleSave}
      />
    </div>
  )
}