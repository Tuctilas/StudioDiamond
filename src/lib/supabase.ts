import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Cliente único (browser + SSR). Para leituras públicas o anon basta;
// sessão do anunciante fica no localStorage (rotas do painel são client-side).
export const supabase = createClient(url, anonKey)

export type ProfileStatus = 'pending' | 'active' | 'paused'

export interface Profile {
  id: string
  user_id: string | null
  slug: string
  nome_exibicao: string
  idade: number | null
  cidade: string | null
  bairro: string | null
  altura: string | null
  peso: string | null
  bio: string | null
  telefone: string | null
  whatsapp: string | null
  preco_hora: number | null
  status: ProfileStatus
  destaque: boolean
  created_at: string
}

export interface ProfilePhoto {
  id: string
  profile_id: string
  url: string
  ordem: number
  is_capa: boolean
}

export interface Cidade {
  id: string
  slug: string
  nome: string
  estado: string
}

export interface Category {
  id: string
  slug: string
  nome: string
}

/** Monta o link de WhatsApp com DDI 55 e mensagem pronta. */
export function waLink(phone: string | null, nome?: string): string {
  const d = String(phone ?? '').replace(/\D/g, '')
  if (!d) return ''
  const num = d.length <= 11 ? `55${d}` : d
  const msg = encodeURIComponent(
    `Olá${nome ? `, vi o perfil de ${nome} no Studio Diamond` : ''}! Gostaria de mais informações.`,
  )
  return `https://wa.me/${num}?text=${msg}`
}

export function fmtBRL(v: number | null | undefined): string {
  if (v == null) return ''
  return `R$ ${Number(v).toLocaleString('pt-BR')}`
}
