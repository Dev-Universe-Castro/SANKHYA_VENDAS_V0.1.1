import axios from 'axios';

// Serviço de gerenciamento de leads integrado com Sankhya
export interface Lead {
  CODLEAD: string
  NOME: string
  DESCRICAO: string
  VALOR: number
  ESTAGIO: 'Leads' | 'Discovery' | 'Demo' | 'Won' // Mantido para compatibilidade, mas CODESTAGIO será usado
  CODESTAGIO: string // Novo campo para o estágio do funil
  CODFUNIL: string // Novo campo para o funil
  DATA_VENCIMENTO: string
  TIPO_TAG: string
  COR_TAG: string
  CODPARC?: string
  ATIVO: string
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
}

const ENDPOINT_LOGIN = "https://api.sandbox.sankhya.com.br/login";
const URL_CONSULTA_SERVICO = "https://api.sandbox.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=CRUDServiceProvider.loadRecords&outputType=json";
const URL_SAVE_SERVICO = "https://api.sandbox.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=DatasetSP.save&outputType=json";

const LOGIN_HEADERS = {
  'token': "c3744c65-acd9-4d36-aa35-49ecb13aa774",
  'appkey': "79bf09c7-7aa9-4ac6-b8a4-0c3aa7acfcae",
  'username': "renan.silva@sankhya.com.br",
  'password': "Integracao123!"
};

let cachedToken: string | null = null;

async function obterToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const resposta = await axios.post(ENDPOINT_LOGIN, {}, {
      headers: LOGIN_HEADERS,
      timeout: 10000
    });

    const token = resposta.data.bearerToken || resposta.data.token;

    if (!token) {
      throw new Error("Token não encontrado na resposta de login.");
    }

    cachedToken = token;
    return token;

  } catch (erro: any) {
    cachedToken = null;
    throw new Error(`Falha na autenticação Sankhya: ${erro.message}`);
  }
}

async function fazerRequisicaoAutenticada(fullUrl: string, method = 'POST', data = {}) {
  const token = await obterToken();

  try {
    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      data: data,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const resposta = await axios(config);
    return resposta.data;

  } catch (erro: any) {
    if (erro.response && (erro.response.status === 401 || erro.response.status === 403)) {
      cachedToken = null;
      throw new Error("Sessão expirada. Tente novamente.");
    }

    const errorDetails = erro.response?.data || erro.message;
    console.error("❌ Erro na requisição Sankhya:", {
      url: fullUrl,
      method,
      error: errorDetails
    });

    throw new Error(`Falha na comunicação com a API Sankhya: ${JSON.stringify(errorDetails)}`);
  }
}

function mapearLeeds(entities: any): Lead[] {
  if (!entities || !entities.entity) {
    return [];
  }

  const fieldNames = entities.metadata.fields.field.map((f: any) => f.name);
  const entityArray = Array.isArray(entities.entity) ? entities.entity : [entities.entity];

  return entityArray.map((rawEntity: any) => {
    const cleanObject: any = {};

    // Mapeia CODLEAD da chave primária (vem na estrutura $)
    if (rawEntity.$) {
      cleanObject.CODLEAD = rawEntity.$.CODLEAD || "";
    } else {
      cleanObject.CODLEAD = "";
    }

    // Mapeia os outros campos (f0, f1, f2, etc.)
    for (let i = 0; i < fieldNames.length; i++) {
      const fieldKey = `f${i}`;
      const fieldName = fieldNames[i];

      if (rawEntity[fieldKey]) {
        cleanObject[fieldName] = rawEntity[fieldKey].$;
      }
    }

    return cleanObject as Lead;
  });
}

export async function consultarLeads(): Promise<Lead[]> {
  const LEADS_PAYLOAD = {
    "requestBody": {
      "dataSet": {
        "rootEntity": "AD_LEADS",
        "includePresentationFields": "S",
        "offsetPage": "0",
        "entity": {
          "fieldset": {
            "list": "NOME, DESCRICAO, VALOR, CODESTAGIO, DATA_VENCIMENTO, TIPO_TAG, COR_TAG, CODPARC, CODFUNIL, ATIVO, DATA_CRIACAO, DATA_ATUALIZACAO"
          }
        },
        "criteria": {
          "expression": {
            "$": "ATIVO = 'S'"
          }
        }
      }
    }
  };

  try {
    const respostaCompleta = await fazerRequisicaoAutenticada(
      URL_CONSULTA_SERVICO,
      'POST',
      LEADS_PAYLOAD
    );

    // Validação segura da estrutura da resposta
    if (!respostaCompleta || !respostaCompleta.responseBody) {
      return [];
    }

    const responseBody = respostaCompleta.responseBody;

    // Verificar se há entities
    if (!responseBody.entities) {
      return [];
    }

    const entities = responseBody.entities;

    // Verificar se entities tem a propriedade entity
    if (!entities.entity) {
      return [];
    }

    const leads = mapearLeeds(entities);

    return leads;

  } catch (erro) {
    console.error("❌ API Error - Erro ao consultar leads:", erro);
    return [];
  }
}

export async function salvarLead(lead: Partial<Lead>): Promise<Lead> {
  const isUpdate = !!lead.CODLEAD;

  // Converter data de YYYY-MM-DD para DD/MM/YYYY
  const formatarDataParaSankhya = (dataISO: string | undefined) => {
    if (!dataISO) return "";
    try {
      const [ano, mes, dia] = dataISO.split('-').map(Number);
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    } catch (e) {
      console.error("Erro ao formatar data:", dataISO, e);
      return "";
    }
  };

  const currentDate = formatarDataParaSankhya(new Date().toISOString().split('T')[0]);

  let fields: string[];
  let values: Record<string, any>;
  let record: any;

  if (isUpdate) {
    fields = ["NOME", "DESCRICAO", "VALOR", "CODESTAGIO", "DATA_VENCIMENTO", "TIPO_TAG", "COR_TAG", "CODPARC", "CODFUNIL", "DATA_ATUALIZACAO"];
    values = {
      "0": lead.NOME || "",
      "1": lead.DESCRICAO || "",
      "2": String(lead.VALOR || 0),
      "3": String(lead.CODESTAGIO || ""),
      "4": formatarDataParaSankhya(lead.DATA_VENCIMENTO),
      "5": lead.TIPO_TAG || "",
      "6": lead.COR_TAG || "#3b82f6",
      "7": lead.CODPARC ? String(lead.CODPARC) : "",
      "8": lead.CODFUNIL ? String(lead.CODFUNIL) : "",
      "9": currentDate
    };
    record = {
      pk: { CODLEAD: String(lead.CODLEAD) },
      values: values
    };
  } else {
    fields = ["NOME", "DESCRICAO", "VALOR", "CODESTAGIO", "DATA_VENCIMENTO", "TIPO_TAG", "COR_TAG", "CODPARC", "CODFUNIL", "ATIVO", "DATA_CRIACAO", "DATA_ATUALIZACAO"];
    values = {
      "0": lead.NOME || "",
      "1": lead.DESCRICAO || "",
      "2": String(lead.VALOR || 0),
      "3": String(lead.CODESTAGIO || ""),
      "4": formatarDataParaSankhya(lead.DATA_VENCIMENTO),
      "5": lead.TIPO_TAG || "",
      "6": lead.COR_TAG || "#3b82f6",
      "7": lead.CODPARC ? String(lead.CODPARC) : "",
      "8": lead.CODFUNIL ? String(lead.CODFUNIL) : "",
      "9": "S",
      "10": currentDate,
      "11": currentDate
    };
    record = { values: values };
  }

  const SAVE_PAYLOAD = {
    "serviceName": "DatasetSP.save",
    "requestBody": {
      "entityName": "AD_LEADS",
      "standAlone": false,
      "fields": fields,
      "records": [record]
    }
  };

  try {
    const resposta = await fazerRequisicaoAutenticada(
      URL_SAVE_SERVICO,
      'POST',
      SAVE_PAYLOAD
    );

    // Recarregar o lead atualizado
    const leads = await consultarLeads();
    const leadSalvo = isUpdate
      ? leads.find(l => l.CODLEAD === lead.CODLEAD)
      : leads[leads.length - 1];

    return leadSalvo || resposta.responseBody;

  } catch (erro: any) {
    console.error("❌ Erro ao salvar lead:", {
      message: erro.message,
      payload: SAVE_PAYLOAD
    });
    throw erro;
  }
}

export async function atualizarEstagioLead(codLeed: string, novoEstagio: string): Promise<Lead | undefined> {
  const formatarDataParaSankhya = (dataISO: string | undefined) => {
    if (!dataISO) return "";
    try {
      const [ano, mes, dia] = dataISO.split('-').map(Number);
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    } catch (e) {
      console.error("Erro ao formatar data:", dataISO, e);
      return "";
    }
  };

  const currentDate = formatarDataParaSankhya(new Date().toISOString().split('T')[0]);

  const PAYLOAD = {
    "serviceName": "DatasetSP.save",
    "requestBody": {
      "entityName": "AD_LEADS",
      "standAlone": false,
      "fields": ["CODESTAGIO", "DATA_ATUALIZACAO"],
      "records": [{
        pk: { CODLEAD: String(codLeed) },
        values: { "0": String(novoEstagio), "1": currentDate }
      }]
    }
  };

  try {
    await fazerRequisicaoAutenticada(
      URL_SAVE_SERVICO,
      'POST',
      PAYLOAD
    );

    // Recarregar o lead atualizado
    const leads = await consultarLeads();
    const leadAtualizado = leads.find(l => l.CODLEAD === codLeed);

    return leadAtualizado;

  } catch (erro: any) {
    console.error("❌ Erro ao atualizar estágio:", {
      message: erro.message,
      payload: PAYLOAD
    });
    throw erro;
  }
}

export async function deletarLead(codLeed: string): Promise<void> {
  const formatarDataParaSankhya = (dataISO: string | undefined) => {
    if (!dataISO) return "";
    try {
      const [ano, mes, dia] = dataISO.split('-').map(Number);
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    } catch (e) {
      console.error("Erro ao formatar data:", dataISO, e);
      return "";
    }
  };

  const currentDate = formatarDataParaSankhya(new Date().toISOString().split('T')[0]);

  const DELETE_PAYLOAD = {
    "serviceName": "DatasetSP.save",
    "requestBody": {
      "entityName": "AD_LEADS",
      "standAlone": false,
      "fields": [
        "CODLEAD",
        "ATIVO",
        "DATA_ATUALIZACAO"
      ],
      "records": [
        {
          "pk": {
            "CODLEAD": String(codLeed)
          },
          "values": {
            "1": "N",
            "2": currentDate
          }
        }
      ]
    }
  };

  try {
    await fazerRequisicaoAutenticada(
      URL_SAVE_SERVICO,
      'POST',
      DELETE_PAYLOAD
    );

  } catch (erro: any) {
    console.error("Erro ao deletar lead:", erro);
    throw erro;
  }
}