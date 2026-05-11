export interface Permission {
  id: string;
  nome: string;
  chave: string;
  grupo: string;
}

export interface Role {
  id: string;
  nome: string;
  descricao?: string;
  created_at: string;
  users_count: number;
  permissions: string[]; // array de chaves de permissão
}

export interface CreateRoleData {
  nome: string;
  descricao?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  nome?: string;
  descricao?: string;
  permissions?: string[];
}
