"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Calendar, DollarSign, ChevronRight, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LeadModal } from "@/components/lead-modal"
import { FunilModal } from "@/components/funil-modal"
import { EstagiosModal } from "@/components/estagios-modal"
import { useToast } from "@/hooks/use-toast"
import { consultarLeads, atualizarEstagioLead, type Lead } from "@/lib/leads-service"
import type { Funil, EstagioFunil } from "@/lib/funis-service"
import type { User } from "@/lib/auth-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

const TAG_COLORS: Record<string, string> = {
  'Ads Production': 'bg-blue-100 text-blue-700',
  'Landing Page': 'bg-red-100 text-red-700',
  'Dashboard': 'bg-green-100 text-green-700',
  'UX Design': 'bg-pink-100 text-pink-700',
  'Video Production': 'bg-amber-100 text-amber-700',
  'Typeface': 'bg-cyan-100 text-cyan-700',
  'Web Design': 'bg-purple-100 text-purple-700'
}

export default function LeadsKanban() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFunilModalOpen, setIsFunilModalOpen] = useState(false)
  const [isEstagiosModalOpen, setIsEstagiosModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedFunilForEdit, setSelectedFunilForEdit] = useState<Funil | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [selectedFunil, setSelectedFunil] = useState<Funil | null>(null)
  const [funis, setFunis] = useState<Funil[]>([])
  const [estagios, setEstagios] = useState<EstagioFunil[]>([])
  const [selectedEstagioTab, setSelectedEstagioTab] = useState<string>("")
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    loadFunis()
  }, [])

  useEffect(() => {
    if (selectedFunil) {
      setIsLoading(true)
      Promise.all([loadEstagios(), loadLeads()])
        .finally(() => {
          requestAnimationFrame(() => {
            setIsLoading(false)
          })
        })
    }
  }, [selectedFunil])

  const loadFunis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/funis', {
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao carregar funis')
      }

      const data = await response.json()
      setFunis(data)

      if (data.length === 0) {
        console.warn("⚠️ Nenhum funil retornado da API")
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar funis:", error)
      toast({
        title: "Erro ao conectar com a API",
        description: "Verifique sua conexão e tente novamente. Se o problema persistir, recarregue a página.",
        variant: "destructive",
      })
      // Não limpar os funis em caso de erro, manter os dados anteriores se existirem
    } finally {
      setIsLoading(false)
    }
  }

  const loadEstagios = async () => {
    if (!selectedFunil) return
    try {
      const response = await fetch(`/api/funis/estagios?codFunil=${selectedFunil.CODFUNIL}`)
      if (!response.ok) throw new Error('Falha ao carregar estágios')
      const data = await response.json()
      setEstagios(data)
      // Definir o primeiro estágio como selecionado
      if (data.length > 0 && !selectedEstagioTab) {
        const sortedEstagios = [...data].sort((a, b) => a.ORDEM - b.ORDEM)
        setSelectedEstagioTab(sortedEstagios[0].CODESTAGIO)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/leads', {
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao carregar leads')
      }

      const data = await response.json()
      setLeads(data)
    } catch (error: any) {
      console.error("Erro ao carregar leads:", error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao carregar leads. Atualizando página...",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleCreate = () => {
    setSelectedLead(null)
    setIsModalOpen(true)
  }

  const handleEdit = (lead: Lead) => {
    // Garantir que o lead está completamente carregado antes de abrir
    setSelectedLead(lead)
    // Usar duplo requestAnimationFrame para garantir que o estado foi atualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalOpen(true)
      })
    })
  }

  const handleSave = async () => {
    setIsModalOpen(false)
    await loadLeads()
    toast({
      title: "Sucesso",
      description: selectedLead ? "Lead atualizado!" : "Lead criado!",
    })
  }

  const handleFunilSaved = async () => {
    setIsFunilModalOpen(false)
    await loadFunis()
    toast({
      title: "Sucesso",
      description: selectedFunilForEdit ? "Funil atualizado!" : "Funil criado!",
    })
  }

  const handleEstagiosSaved = async () => {
    setIsEstagiosModalOpen(false)
    if (selectedFunil) {
      await loadEstagios()
    }
    toast({
      title: "Sucesso",
      description: "Estágios atualizados!",
    })
  }

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (codEstagio: string, nomeEstagio: string) => {
    if (!draggedLead || draggedLead.CODESTAGIO === codEstagio) {
      setDraggedLead(null)
      return
    }

    const leadOriginal = draggedLead

    setLeads(prev => prev.map(l => 
      l.CODLEAD === draggedLead.CODLEAD 
        ? { ...l, CODESTAGIO: codEstagio }
        : l
    ))
    setDraggedLead(null)

    try {
      const response = await fetch('/api/leads/atualizar-estagio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codLeed: leadOriginal.CODLEAD, novoEstagio: codEstagio })
      })

      if (!response.ok) throw new Error('Falha ao atualizar estágio')

      toast({
        title: "Sucesso",
        description: `Lead movido para ${nomeEstagio}`,
      })
    } catch (error: any) {
      setLeads(prev => prev.map(l => 
        l.CODLEAD === leadOriginal.CODLEAD 
          ? leadOriginal
          : l
      ))

      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar estágio. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getLeadsByEstagio = (codEstagio: string) => {
    return leads.filter(lead => {
      const matchesSearch = lead.NOME.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.DESCRICAO.toLowerCase().includes(searchTerm.toLowerCase())
      return lead.CODESTAGIO === codEstagio && matchesSearch
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleCreateFunil = () => {
    setSelectedFunilForEdit(null)
    requestAnimationFrame(() => {
      setIsFunilModalOpen(true)
    })
  }

  // Se nenhum funil foi selecionado, mostrar lista de funis
  if (!selectedFunil) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Funis de Vendas</h1>
            <Button
              onClick={handleCreateFunil}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Funil
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Selecione um funil para gerenciar seus leads
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg p-6 shadow-sm border border-border animate-pulse">
                  <div className="space-y-3">
                    <div className="h-6 w-32 bg-muted rounded"></div>
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : funis.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-muted-foreground">
                <p>Nenhum funil disponível</p>
                <p className="text-sm mt-2">Crie um novo funil para começar ou tente recarregar</p>
              </div>
              <Button
                onClick={loadFunis}
                variant="outline"
                className="mx-auto"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {funis.map((funil) => (
                <div key={funil.CODFUNIL} className="relative bg-card rounded-lg p-6 shadow-sm border border-border hover:shadow-lg transition-all group">
                  <button
                    onClick={() => setSelectedFunil(funil)}
                    className="text-left w-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: funil.COR }}
                        />
                        <h3 className="font-semibold text-lg text-foreground">{funil.NOME}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    {funil.DESCRICAO && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{funil.DESCRICAO}</p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modais sempre disponíveis */}
        <FunilModal
          isOpen={isFunilModalOpen}
          onClose={() => setIsFunilModalOpen(false)}
          funil={selectedFunilForEdit}
          onSave={handleFunilSaved}
        />
      </>
    )
  }

  // Se um funil foi selecionado, mostrar o Kanban
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de voltar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFunil(null)}
            className="text-muted-foreground hover:text-foreground h-9 px-3"
          >
            ← Voltar
          </Button>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: selectedFunil.COR }}
            />
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{selectedFunil.NOME}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedFunilForEdit(selectedFunil)
              setIsEstagiosModalOpen(true)
            }}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {!isMobile && <span>Configurar Estágios</span>}
          </Button>
          <Button
            onClick={handleCreate}
            size={isMobile ? "sm" : "default"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isMobile ? "Novo" : "Adicionar Novo"}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search deals"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card h-10"
          />
        </div>
        {!isMobile && (
          <>
            <Button variant="outline" className="flex items-center gap-2">
              <span>Filter</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <span>Sort</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <span>Group</span>
            </Button>
          </>
        )}
      </div>

      {/* Cards Totalizadores - Apenas Desktop */}
      {!isMobile && estagios.length > 0 && (
        <div className="grid gap-4" style={{ 
          gridTemplateColumns: `repeat(${estagios.length}, minmax(300px, 1fr))` 
        }}>
          {estagios.map((estagio) => {
            const leadsList = getLeadsByEstagio(estagio.CODESTAGIO)
            const totalValue = leadsList.reduce((sum, lead) => sum + lead.VALOR, 0)

            return (
              <div
                key={`totalizador-${estagio.CODESTAGIO}`}
                className="bg-card rounded-lg p-4 shadow-sm border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: estagio.COR }}
                  />
                  <h4 className="text-sm font-medium text-muted-foreground">{estagio.NOME}</h4>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {leadsList.length} {leadsList.length === 1 ? 'lead' : 'leads'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Kanban Board - Desktop e Mobile */}
      {isMobile ? (
        // Visualização Mobile com Tabs
        <div className="space-y-4">
          {estagios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Configure os estágios deste funil para começar
            </div>
          ) : (
            <Tabs value={selectedEstagioTab} onValueChange={setSelectedEstagioTab} className="w-full">
              <TabsList className="w-full flex overflow-x-auto gap-1 p-1 h-auto">
                {estagios.sort((a, b) => a.ORDEM - b.ORDEM).map((estagio) => {
                  const leadsList = getLeadsByEstagio(estagio.CODESTAGIO)
                  return (
                    <TabsTrigger 
                      key={estagio.CODESTAGIO} 
                      value={estagio.CODESTAGIO}
                      className="flex items-center gap-1.5 flex-1 min-w-fit px-3 py-2 h-auto whitespace-nowrap"
                    >
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: estagio.COR }}
                      />
                      <span className="text-sm truncate max-w-[80px]">{estagio.NOME}</span>
                      <span className="text-xs opacity-70 flex-shrink-0">({leadsList.length})</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {estagios.sort((a, b) => a.ORDEM - b.ORDEM).map((estagio) => {
                const leadsList = getLeadsByEstagio(estagio.CODESTAGIO)
                const totalValue = leadsList.reduce((sum, lead) => sum + lead.VALOR, 0)

                return (
                  <TabsContent key={estagio.CODESTAGIO} value={estagio.CODESTAGIO} className="mt-4">
                    {/* Card Totalizador do Estágio */}
                    <div className="bg-card rounded-lg p-4 shadow-sm border border-border mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: estagio.COR }}
                        />
                        <h4 className="text-sm font-medium text-muted-foreground">{estagio.NOME}</h4>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(totalValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {leadsList.length} {leadsList.length === 1 ? 'lead' : 'leads'}
                        </div>
                      </div>
                    </div>

                    {/* Cards dos Leads */}
                    <div className="space-y-3">
                      {isLoading ? (
                        <>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card rounded-lg p-4 shadow-sm border border-border animate-pulse">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-muted"></div>
                                    <div>
                                      <div className="h-4 w-24 bg-muted rounded mb-1"></div>
                                      <div className="h-3 w-32 bg-muted rounded"></div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-3 w-full bg-muted rounded"></div>
                                  <div className="h-6 w-20 bg-muted rounded"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : leadsList.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          Nenhum lead neste estágio
                        </div>
                      ) : (
                        leadsList.map((lead, index) => (
                          <div
                            key={`${estagio.CODESTAGIO}-${lead.CODLEAD || `temp-${index}`}`}
                            onClick={() => handleEdit(lead)}
                            className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-border"
                          >
                            <div className="space-y-3">
                              {/* Lead Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                    {lead.NOME.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-foreground">{lead.NOME}</h4>
                                    <p className="text-xs text-muted-foreground">{lead.DESCRICAO}</p>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Lead Info */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-semibold text-foreground">{formatCurrency(lead.VALOR)}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{formatDate(lead.DATA_VENCIMENTO)}</span>
                                </div>

                                {/* Tag */}
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${TAG_COLORS[lead.TIPO_TAG] || 'bg-gray-100 text-gray-700'}`}>
                                    {lead.TIPO_TAG}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </div>
      ) : (
        // Visualização Desktop - Kanban
        <div className="grid gap-4" style={{ 
          gridTemplateColumns: `repeat(${estagios.length || 1}, minmax(300px, 1fr))` 
        }}>
          {estagios.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Configure os estágios deste funil para começar
            </div>
          ) : (
            estagios.sort((a, b) => a.ORDEM - b.ORDEM).map((estagio) => {
              const leadsList = getLeadsByEstagio(estagio.CODESTAGIO)
              const totalValue = leadsList.reduce((sum, lead) => sum + lead.VALOR, 0)

              return (
                <div
                  key={estagio.CODESTAGIO}
                  className={`bg-muted/30 rounded-lg p-4 min-h-[600px] transition-colors ${
                    draggedLead && draggedLead.CODESTAGIO !== estagio.CODESTAGIO 
                      ? 'ring-2 ring-primary/50 bg-primary/5' 
                      : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(estagio.CODESTAGIO, estagio.NOME)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: estagio.COR }}
                      />
                      <h3 className="font-semibold text-foreground">{estagio.NOME}</h3>
                      <span className="text-sm text-muted-foreground">{leadsList.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {isLoading ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-card rounded-lg p-4 shadow-sm border border-border animate-pulse">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                                  <div>
                                    <div className="h-4 w-24 bg-muted rounded mb-1"></div>
                                    <div className="h-3 w-32 bg-muted rounded"></div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 w-full bg-muted rounded"></div>
                                <div className="h-6 w-20 bg-muted rounded"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : leadsList.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        Nenhum lead
                      </div>
                    ) : (
                      leadsList.map((lead, index) => (
                        <div
                          key={`${estagio.CODESTAGIO}-${lead.CODLEAD || `temp-${index}`}`}
                          draggable
                          onDragStart={() => handleDragStart(lead)}
                          onDragEnd={() => setDraggedLead(null)}
                          onClick={(e) => {
                            if (!draggedLead) {
                              handleEdit(lead)
                            }
                          }}
                          className={`bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move border border-border ${
                            draggedLead?.CODLEAD === lead.CODLEAD ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Lead Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                  {lead.NOME.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-foreground">{lead.NOME}</h4>
                                  <p className="text-xs text-muted-foreground">{lead.DESCRICAO}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </div>

                            {/* Lead Info */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="font-semibold text-foreground">{formatCurrency(lead.VALOR)}</span>
                                <span className="text-muted-foreground">•</span>
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{formatDate(lead.DATA_VENCIMENTO)}</span>
                              </div>

                              {/* Tag */}
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-md font-medium ${TAG_COLORS[lead.TIPO_TAG] || 'bg-gray-100 text-gray-700'}`}>
                                  {lead.TIPO_TAG}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onSave={handleSave}
        funilSelecionado={selectedFunil ? { CODFUNIL: selectedFunil.CODFUNIL, estagios } : undefined}
      />

      {/* Modais sempre disponíveis */}
      <FunilModal
        isOpen={isFunilModalOpen}
        onClose={() => setIsFunilModalOpen(false)}
        funil={selectedFunilForEdit}
        onSave={handleFunilSaved}
      />
      <EstagiosModal
        isOpen={isEstagiosModalOpen}
        onClose={() => setIsEstagiosModalOpen(false)}
        funil={selectedFunilForEdit}
        onSave={handleEstagiosSaved}
      />
    </div>
  )
}