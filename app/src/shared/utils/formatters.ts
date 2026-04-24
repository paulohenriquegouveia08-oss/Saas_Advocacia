// ============================================
// Juris Gestão — Formatação e Utilidades
// ============================================

/** Formatar data para exibição pt-BR */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formatar data e hora */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formatar moeda BRL */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Formatar CPF */
export function formatCPF(cpf: string | null): string {
  if (!cpf) return '—';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/** Formatar telefone BR */
export function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/** Gerar link do WhatsApp */
export function getWhatsAppLink(phone: string | null, message?: string): string {
  if (!phone) return '#';
  const cleaned = phone.replace(/\D/g, '');
  const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  const base = `https://wa.me/${fullPhone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Calcular dias restantes até uma data */
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Classificação de urgência do prazo */
export function getDeadlineUrgency(dateStr: string): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const days = daysUntil(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 2) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
