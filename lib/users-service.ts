
import axios from 'axios';
import { cryptoService } from './crypto-service';
import type { User } from './types';

export type { User };

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
      },
      timeout: 15000
    };

    const resposta = await axios(config);
    return resposta.data;

  } catch (erro: any) {
    if (erro.response && (erro.response.status === 401 || erro.response.status === 403)) {
      cachedToken = null;
      throw new Error("Sessão expirada. Tente novamente.");
    }

    throw new Error(`Falha na comunicação com a API Sankhya: ${erro.message}`);
  }
}

function mapearUsuarios(entities: any): User[] {
  const fieldNames = entities.metadata.fields.field.map((f: any) => f.name);
  const entityArray = Array.isArray(entities.entity) ? entities.entity : [entities.entity];

  return entityArray.map((rawEntity: any) => {
    const cleanObject: any = {};

    for (let i = 0; i < fieldNames.length; i++) {
      const fieldKey = `f${i}`;
      const fieldName = fieldNames[i];

      if (rawEntity[fieldKey]) {
        cleanObject[fieldName] = rawEntity[fieldKey].$;
      }
    }

    return {
      id: parseInt(cleanObject.CODUSUARIO) || 0,
      name: cleanObject.NOME || '',
      email: cleanObject.EMAIL || '',
      role: cleanObject.FUNCAO || 'Vendedor',
      status: cleanObject.STATUS || 'pendente',
      password: cleanObject.SENHA || '',
      avatar: cleanObject.AVATAR || ''
    };
  });
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const USUARIOS_PAYLOAD = {
      "requestBody": {
        "dataSet": {
          "rootEntity": "AD_USUARIOSVENDAS",
          "includePresentationFields": "N",
          "entity": {
            "fieldset": {
              "list": "CODUSUARIO, NOME, EMAIL, FUNCAO, STATUS, AVATAR"
            }
          }
        }
      }
    };

    try {
      const respostaCompleta = await fazerRequisicaoAutenticada(
        URL_CONSULTA_SERVICO,
        'POST',
        USUARIOS_PAYLOAD
      );

      const entities = respostaCompleta.responseBody.entities;

      if (!entities || !entities.entity) {
        return [];
      }

      return mapearUsuarios(entities);
    } catch (erro) {
      console.error("Erro ao buscar usuários:", erro);
      return [];
    }
  },

  async getPending(): Promise<User[]> {
    const USUARIOS_PAYLOAD = {
      "requestBody": {
        "dataSet": {
          "rootEntity": "AD_USUARIOSVENDAS",
          "includePresentationFields": "N",
          "entity": {
            "fieldset": {
              "list": "CODUSUARIO, NOME, EMAIL, FUNCAO, STATUS, AVATAR"
            }
          },
          "criteria": {
            "expression": {
              "$": "STATUS = 'pendente'"
            }
          }
        }
      }
    };

    try {
      const respostaCompleta = await fazerRequisicaoAutenticada(
        URL_CONSULTA_SERVICO,
        'POST',
        USUARIOS_PAYLOAD
      );

      const entities = respostaCompleta.responseBody.entities;

      if (!entities || !entities.entity) {
        return [];
      }

      return mapearUsuarios(entities);
    } catch (erro) {
      console.error("Erro ao buscar usuários pendentes:", erro);
      return [];
    }
  },

  async getById(id: number): Promise<User | undefined> {
    const USUARIOS_PAYLOAD = {
      "requestBody": {
        "dataSet": {
          "rootEntity": "AD_USUARIOSVENDAS",
          "includePresentationFields": "N",
          "entity": {
            "fieldset": {
              "list": "CODUSUARIO, NOME, EMAIL, FUNCAO, STATUS, AVATAR, SENHA"
            }
          },
          "criteria": {
            "expression": {
              "$": `CODUSUARIO = ${id}`
            }
          }
        }
      }
    };

    try {
      const respostaCompleta = await fazerRequisicaoAutenticada(
        URL_CONSULTA_SERVICO,
        'POST',
        USUARIOS_PAYLOAD
      );

      const entities = respostaCompleta.responseBody.entities;

      if (!entities || !entities.entity) {
        return undefined;
      }

      const usuarios = mapearUsuarios(entities);
      return usuarios[0];
    } catch (erro) {
      console.error("Erro ao buscar usuário por ID:", erro);
      return undefined;
    }
  },

  async register(userData: { name: string; email: string; password: string }): Promise<User> {
    const existingUsers = await this.search(userData.email);
    if (existingUsers.length > 0) {
      throw new Error("Email já cadastrado");
    }

    const hashedPassword = await cryptoService.hashPassword(userData.password);

    const CREATE_PAYLOAD = {
      "serviceName": "DatasetSP.save",
      "requestBody": {
        "entityName": "AD_USUARIOSVENDAS",
        "standAlone": false,
        "fields": ["NOME", "EMAIL", "SENHA", "FUNCAO", "STATUS"],
        "records": [{
          "values": {
            "0": userData.name,
            "1": userData.email,
            "2": hashedPassword,
            "3": "Vendedor",
            "4": "pendente"
          }
        }]
      }
    };

    try {
      await fazerRequisicaoAutenticada(URL_SAVE_SERVICO, 'POST', CREATE_PAYLOAD);
      
      const newUsers = await this.search(userData.email);
      if (newUsers.length > 0) {
        return newUsers[0];
      }
      
      throw new Error("Erro ao recuperar usuário criado");
    } catch (erro: any) {
      throw new Error(`Erro ao registrar usuário: ${erro.message}`);
    }
  },

  async create(userData: Omit<User, "id">): Promise<User> {
    const hashedPassword = userData.password ? await cryptoService.hashPassword(userData.password) : '';

    const CREATE_PAYLOAD = {
      "serviceName": "DatasetSP.save",
      "requestBody": {
        "entityName": "AD_USUARIOSVENDAS",
        "standAlone": false,
        "fields": ["NOME", "EMAIL", "SENHA", "FUNCAO", "STATUS", "AVATAR"],
        "records": [{
          "values": {
            "0": userData.name,
            "1": userData.email,
            "2": hashedPassword,
            "3": userData.role,
            "4": userData.status,
            "5": userData.avatar || ''
          }
        }]
      }
    };

    try {
      await fazerRequisicaoAutenticada(URL_SAVE_SERVICO, 'POST', CREATE_PAYLOAD);
      
      const newUsers = await this.search(userData.email);
      if (newUsers.length > 0) {
        return newUsers[0];
      }
      
      throw new Error("Erro ao recuperar usuário criado");
    } catch (erro: any) {
      throw new Error(`Erro ao criar usuário: ${erro.message}`);
    }
  },

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    const UPDATE_PAYLOAD = {
      "serviceName": "DatasetSP.save",
      "requestBody": {
        "entityName": "AD_USUARIOSVENDAS",
        "standAlone": false,
        "fields": ["CODUSUARIO", "NOME", "EMAIL", "FUNCAO", "STATUS", "AVATAR"],
        "records": [{
          "pk": {
            "CODUSUARIO": String(id)
          },
          "values": {
            "1": userData.name || '',
            "2": userData.email || '',
            "3": userData.role || '',
            "4": userData.status || '',
            "5": userData.avatar || ''
          }
        }]
      }
    };

    try {
      await fazerRequisicaoAutenticada(URL_SAVE_SERVICO, 'POST', UPDATE_PAYLOAD);
      return await this.getById(id) || null;
    } catch (erro: any) {
      throw new Error(`Erro ao atualizar usuário: ${erro.message}`);
    }
  },

  async approve(id: number): Promise<User | null> {
    return await this.update(id, { status: 'ativo' });
  },

  async block(id: number): Promise<User | null> {
    return await this.update(id, { status: 'bloqueado' });
  },

  async delete(id: number): Promise<boolean> {
    const UPDATE_PAYLOAD = {
      "serviceName": "DatasetSP.save",
      "requestBody": {
        "entityName": "AD_USUARIOSVENDAS",
        "standAlone": false,
        "fields": ["CODUSUARIO", "STATUS"],
        "records": [{
          "pk": {
            "CODUSUARIO": String(id)
          },
          "values": {
            "1": "bloqueado"
          }
        }]
      }
    };

    try {
      await fazerRequisicaoAutenticada(URL_SAVE_SERVICO, 'POST', UPDATE_PAYLOAD);
      return true;
    } catch (erro) {
      return false;
    }
  },

  async search(term: string): Promise<User[]> {
    const USUARIOS_PAYLOAD = {
      "requestBody": {
        "dataSet": {
          "rootEntity": "AD_USUARIOSVENDAS",
          "includePresentationFields": "N",
          "entity": {
            "fieldset": {
              "list": "CODUSUARIO, NOME, EMAIL, FUNCAO, STATUS, AVATAR"
            }
          },
          "criteria": {
            "expression": {
              "$": `NOME LIKE '%${term.toUpperCase()}%' OR EMAIL LIKE '%${term.toUpperCase()}%' OR FUNCAO LIKE '%${term.toUpperCase()}%'`
            }
          }
        }
      }
    };

    try {
      const respostaCompleta = await fazerRequisicaoAutenticada(
        URL_CONSULTA_SERVICO,
        'POST',
        USUARIOS_PAYLOAD
      );

      const entities = respostaCompleta.responseBody.entities;

      if (!entities || !entities.entity) {
        return [];
      }

      return mapearUsuarios(entities);
    } catch (erro) {
      console.error("Erro ao buscar usuários:", erro);
      return [];
    }
  }
};
