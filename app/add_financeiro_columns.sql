-- ============================================
-- ADICIONAR CAMPOS FALTANTES: Módulo Financeiro
-- Execute este script no SQL Editor do Supabase
-- ============================================

ALTER TABLE public."FinancialTransaction"
ADD COLUMN IF NOT EXISTS "beneficiary" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT;
