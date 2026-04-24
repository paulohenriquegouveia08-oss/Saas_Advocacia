// ============================================
// Juris Gestão — TypeScript Type Definitions
// Mapeamento direto das tabelas PostgreSQL
// ============================================

// ---- Enums (espelham os ENUMs do banco) ----
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type DeadlinePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DeadlineStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

// ---- Entidades do Banco ----
export interface Organization {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  isAdmin: boolean;
  permissions: RolePermissions;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface RolePermissions {
  canAccessFinanceiro?: boolean;
  canAccessClientes?: boolean;
  canAccessPrazos?: boolean;
  canEditDelete?: boolean;
  canManageUsers?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roleId: string | null;
  organizationId: string | null;
  clientId?: string | null;
  // Joins
  role?: Role;
  organization?: Organization;
}

export interface Client {
  id: string;
  fullName: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description: string;
  category: string | null;
  dueDate: string;
  paidDate: string | null;
  createdAt: string;
  updatedAt: string;
  clientId: string | null;
  organizationId: string;
  createdById: string;
  beneficiary: string | null;
  paymentMethod: string | null;
  notes: string | null;
  // Joins
  client?: Client;
  createdBy?: User;
}

export interface Deadline {
  id: string;
  title: string;
  processNumber: string | null;
  description: string | null;
  dueDate: string;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  createdAt: string;
  updatedAt: string;
  clientId: string | null;
  organizationId: string;
  createdById: string;
  // Joins
  client?: Client;
  createdBy?: User;
}

export interface FileRecord {
  id: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  clientId: string | null;
  deadlineId: string | null;
  organizationId: string;
  uploadedById: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  userId: string;
  organizationId: string;
  // Joins
  user?: User;
}

// ---- Padrão de Resposta da API (PK Fit Pro Pattern) ----
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

// ---- Auth Context ----
export interface AuthState {
  user: User | null;
  session: import('@supabase/supabase-js').Session | null;
  loading: boolean;
  isAdmin: boolean;
  isClient: boolean;
}
