import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Usuario {
  id_usuario: number;
  tipo_usuario: 'cliente' | 'admin' | 'barbeiro';
  nome_usuario: string;
  email_usuario?: string;
  telefone_usuario?: string;
}

export interface Barbeiro {
  id_barbeiro: number;
  nome_barbeiro: string;
  telefone_barbeiro?: string;
  email_barbeiro?: string;
  especialidade_barbeiro?: string;
}

export interface Servico {
  id_servico: number;
  tipo_servico: string;
  descricao_servico?: string;
  preco_servico: number;
  duracao_servico: string;
}

export interface Agendamento {
  id_agendamento: number;
  data_agendamento: string;
  hora_agendamento: string;
  status_agendamento: 'pendente' | 'confirmado' | 'cancelado';
  tb_usuario_id_usuario: number;
  tb_barbeiro_id_barbeiro: number;
  tb_usuario?: { nome_usuario: string };
  tb_barbeiro?: { id_barbeiro: number; nome_barbeiro: string };
  tb_servico_has_tb_agendamento?: Array<{
    tb_servico: { id_servico: number; tipo_servico: string; preco_servico: number };
  }>;
}

export interface Indisponibilidade {
  id_indisponibilidade: number;
  tb_barbeiro_id_barbeiro: number;
  data_bloqueio: string;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  motivo?: string;
}

export const HORARIOS_FUNCIONAMENTO = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00'
];

export function formatarDuracao(intervalo: string): string {
  if (!intervalo) return '';
  // PostgreSQL interval like "00:30:00" or "01:00:00"
  const match = intervalo.match(/(\d+):(\d+)/);
  if (!match) return intervalo;
  const horas = parseInt(match[1]);
  const minutos = parseInt(match[2]);
  if (horas > 0 && minutos > 0) return `${horas}h ${minutos}min`;
  if (horas > 0) return `${horas}h`;
  return `${minutos}min`;
}

export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function formatarData(data: string): string {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarHora(hora: string): string {
  if (!hora) return '';
  return hora.substring(0, 5);
}

export function isDataPassada(data: string, hora: string): boolean {
  const agora = new Date();
  const dataHora = new Date(`${data}T${hora}`);
  return dataHora < agora;
}

export function getHojeISO(): string {
  return new Date().toISOString().split('T')[0];
}
