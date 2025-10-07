"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Lead } from "@/lib/leads-service"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
  onSave: () => void
  funilSelecionado?: any // Assuming funilSelecionado is passed down
}

interface Partner {
  CODPARC: string
  NOMEPARC: string
  CGC_CPF: string
}

const TIPOS_TAG = [
  'Ads Production',
  'Landing Page',
  'Dashboard',
  'UX Design',
  'Video Production',
  'Typeface',
  'Web Design'
]

export function LeadModal({ isOpen, onClose, lead, onSave, funilSelecionado }: LeadModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    NOME: "",
    DESCRICAO: "",
    VALOR: 0,
    CODESTAGIO: "",
    DATA_VENCIMENTO: new Date().toISOString().split('T')[0],
    TIPO_TAG: "",
    COR_TAG: "#3b82f6",
    CODPARC: undefined,
    CODFUNIL: undefined
  })
  const [isSaving, setIsSaving] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [parceiros, setParceiros] = useState<Partner[]>([])
  const [isLoadingPartners, setIsLoadingPartners] = useState(false)
  const [estagios, setEstagios] = useState<any[]>([])
  const [selectedFunilId, setSelectedFunilId] = useState<string>("")
  const { toast } = useToast()
  const [partnerSearch, setPartnerSearch] = useState("")
  const [partnerLoadError, setPartnerLoadError] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true)
      
      if (lead) {
        // Log para debug - remover depois
        console.log("📋 Carregando dados do lead:", lead)
        
        setFormData({
          NOME: lead.NOME || "",
          DESCRICAO: lead.DESCRICAO || "",
          VALOR: lead.VALOR || 0,
          CODESTAGIO: lead.CODESTAGIO || "",
          DATA_VENCIMENTO: lead.DATA_VENCIMENTO || "",
          TIPO_TAG: lead.TIPO_TAG || "",
          COR_TAG: lead.COR_TAG || "#3b82f6",
          CODPARC: lead.CODPARC || undefined,
          CODFUNIL: lead.CODFUNIL || undefined,
        })
        
        if (lead.CODFUNIL) {
          setSelectedFunilId(lead.CODFUNIL)
        }
      } else {
        setFormData({
          NOME: "",
          DESCRICAO: "",
          VALOR: 0,
          CODESTAGIO: "",
          DATA_VENCIMENTO: new Date().toISOString().split('T')[0],
          TIPO_TAG: "",
          COR_TAG: "#3b82f6",
          CODPARC: undefined,
          CODFUNIL: undefined,
        })
        setSelectedFunilId("")
        setEstagios([])
      }
      
      // Garantir que os dados foram completamente carregados e o DOM atualizado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsInitializing(false)
        })
      })
    }
  }, [lead, isOpen])

  // Resetar estado ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setIsInitializing(false)
      setPartnerSearch("")
    }
  }, [isOpen])

  // Load partners and funnel stages when the modal is opened
  useEffect(() => {
    if (isOpen) {
      loadPartners()
      if (funilSelecionado) {
        setEstagios(funilSelecionado.estagios)
        setSelectedFunilId(funilSelecionado.CODFUNIL)
        // If it's a new lead, automatically select the first stage
        if (!lead && funilSelecionado.estagios.length > 0) {
          setFormData(prev => ({
            ...prev,
            CODFUNIL: funilSelecionado.CODFUNIL,
            CODESTAGIO: funilSelecionado.estagios[0].CODESTAGIO
          }))
        } else if (lead && lead.CODFUNIL === funilSelecionado.CODFUNIL) {
            // If editing and the funnel matches, ensure the correct stage is selected
            setFormData(prev => ({
                ...prev,
                CODFUNIL: funilSelecionado.CODFUNIL,
                CODESTAGIO: lead.CODESTAGIO || (funilSelecionado.estagios.length > 0 ? funilSelecionado.estagios[0].CODESTAGIO : "")
            }))
        }
      } else if (lead && lead.CODFUNIL) {
          // If lead is present but funilSelecionado is not, we might need to fetch it
          // Or assume the CODFUNIL on the lead dictates the stages
          // For this example, we'll set the selectedFunilId and try to fetch stages if possible
          setSelectedFunilId(lead.CODFUNIL)
          // Placeholder: In a real app, you might fetch the funnel details here based on lead.CODFUNIL
          // For now, if funilSelecionado is not provided, stages won't be dynamically loaded for editing
          // unless lead.CODESTAGIO is directly used and stages are hardcoded or fetched separately.
      }
    }
  }, [isOpen, funilSelecionado, lead])


  const loadPartners = async (searchTerm: string = "") => {
    try {
      setIsLoadingPartners(true)
      setPartnerLoadError(false)
      const url = `/api/sankhya/parceiros?page=1&pageSize=50&searchName=${encodeURIComponent(searchTerm)}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Falha ao carregar parceiros')
      }

      const data = await response.json()
      setParceiros(data.parceiros || [])
    } catch (error: any) {
      setPartnerLoadError(true)
      setParceiros([])
      toast({
        title: "Aviso",
        description: "Não foi possível carregar a lista de parceiros. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPartners(false)
    }
  }

  const handlePartnerSearch = (value: string) => {
    setPartnerSearch(value)
    // Load partners if search term is 2 or more characters, or clear search if empty
    if (value.length >= 2) {
      loadPartners(value)
    } else if (value.length === 0) {
      loadPartners()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that a partner has been selected
    if (!formData.CODPARC) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um parceiro.",
        variant: "destructive",
      })
      return
    }

    // Validate that a funnel has been selected (should be auto-filled from funilSelecionado)
    if (!formData.CODFUNIL && !funilSelecionado) {
        toast({
            title: "Atenção",
            description: "Nenhum funil foi selecionado. Por favor, selecione um funil primeiro.",
            variant: "destructive",
        })
        return
    }

    // Validate that a stage has been selected
    if (!formData.CODESTAGIO) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um estágio.",
        variant: "destructive",
      })
      return
    }


    setIsSaving(true)
    setLoadingMessage(lead ? "Atualizando lead..." : "Criando lead...")

    try {
      const dataToSave = {
        ...(lead && { CODLEAD: String(lead.CODLEAD) }),
        NOME: String(formData.NOME || ""),
        DESCRICAO: String(formData.DESCRICAO || ""),
        VALOR: Number(formData.VALOR || 0),
        CODESTAGIO: String(formData.CODESTAGIO || ""),
        CODFUNIL: String(formData.CODFUNIL || funilSelecionado?.CODFUNIL || ""),
        DATA_VENCIMENTO: String(formData.DATA_VENCIMENTO || ""),
        TIPO_TAG: String(formData.TIPO_TAG || ""),
        COR_TAG: String(formData.COR_TAG || "#3b82f6"),
        CODPARC: String(formData.CODPARC || "")
      }

      const response = await fetch('/api/leads/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao salvar lead')
      }

      toast({
        title: "Sucesso",
        description: lead ? "Lead atualizado com sucesso!" : "Lead criado com sucesso!",
      })

      onSave()
      onClose()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar lead. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setLoadingMessage("")
    }
  }

  if (!isOpen) return null

  // Não renderizar o modal até que os dados estejam prontos
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative flex flex-col items-center gap-4 p-6 bg-card rounded-lg shadow-lg border">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg shadow-lg border">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-foreground">
              {isInitializing ? "Carregando dados..." : loadingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isSaving ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {lead ? "Editar Lead" : "Novo Lead"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Partner Selector */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="parceiro" className="text-sm font-medium text-foreground">
                Parceiro *
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.CODPARC ? String(formData.CODPARC) : undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, CODPARC: String(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar parceiro..."
                          value={partnerSearch}
                          onChange={(e) => handlePartnerSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    {isLoadingPartners ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Carregando...</span>
                        </div>
                      </SelectItem>
                    ) : partnerLoadError ? (
                      <SelectItem value="error" disabled>
                        <div className="text-destructive">
                          Erro ao carregar. Feche e tente novamente.
                        </div>
                      </SelectItem>
                    ) : parceiros.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        {partnerSearch ? "Nenhum parceiro encontrado" : "Digite para buscar parceiros"}
                      </SelectItem>
                    ) : (
                      parceiros.map((partner) => (
                        <SelectItem key={partner.CODPARC} value={partner.CODPARC}>
                          {partner.NOMEPARC} - {partner.CGC_CPF}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* End Partner Selector */}

            <div className="space-y-2">
              <Label htmlFor="NOME" className="text-sm font-medium text-foreground">
                Nome do Lead *
              </Label>
              <Input
                id="NOME"
                type="text"
                value={formData.NOME}
                onChange={(e) => setFormData({ ...formData, NOME: e.target.value })}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="VALOR" className="text-sm font-medium text-foreground">
                Valor (USD) *
              </Label>
              <Input
                id="VALOR"
                type="number"
                value={formData.VALOR}
                onChange={(e) => setFormData({ ...formData, VALOR: Number(e.target.value) })}
                className="bg-background"
                required
              />
            </div>

            {/* Funil (oculto - usa automaticamente o funil selecionado) */}
            <input type="hidden" value={formData.CODFUNIL || ""} />

            {/* Stage Selector */}
            <div className="space-y-2">
              <Label htmlFor="CODESTAGIO">Estágio *</Label>
              <select
                id="CODESTAGIO"
                value={formData.CODESTAGIO}
                onChange={(e) => setFormData({ ...formData, CODESTAGIO: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={estagios.length === 0}
              >
                {estagios.length === 0 ? (
                  <option value="">Selecione um funil primeiro</option>
                ) : (
                  estagios.map((estagio) => (
                    <option key={estagio.CODESTAGIO} value={estagio.CODESTAGIO}>
                      {estagio.NOME}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="DATA_VENCIMENTO" className="text-sm font-medium text-foreground">
                Data de Vencimento *
              </Label>
              <Input
                id="DATA_VENCIMENTO"
                type="date"
                value={formData.DATA_VENCIMENTO}
                onChange={(e) => setFormData({ ...formData, DATA_VENCIMENTO: e.target.value })}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="TIPO_TAG" className="text-sm font-medium text-foreground">
                Tipo de Tag *
              </Label>
              <select
                id="TIPO_TAG"
                value={formData.TIPO_TAG}
                onChange={(e) => setFormData({ ...formData, TIPO_TAG: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione uma tag</option>
                {TIPOS_TAG.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="DESCRICAO" className="text-sm font-medium text-foreground">
                Descrição *
              </Label>
              <Textarea
                id="DESCRICAO"
                value={formData.DESCRICAO}
                onChange={(e) => setFormData({ ...formData, DESCRICAO: e.target.value })}
                className="bg-background min-h-[100px]"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : (lead ? "Atualizar" : "Criar")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}