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
  manequim: string | null
  biotipo: string | null
  cabelo: string | null
  olhos: string | null
  seios: string | null
  cintura: string | null
  quadril: string | null
  pes: string | null
  tatuagem: string | null
  piercing: string | null
  fumante: string | null
  signo: string | null
  nivel_cultural: string | null
  observacoes: string | null
  bio: string | null
  telefone: string | null
  whatsapp: string | null
  preco_hora: number | null
  preco_2h: number | null
  preco_pernoite: string | null
  status: ProfileStatus
  destaque: boolean
  plano: PlanoSlug | null
  plano_rank: number
  plano_expira: string | null
  termos_aceitos_em: string | null
  verificado: boolean
  vip_ativo: boolean
  vip_preco: number | null
  capa_video_url: string | null
  rede_instagram: string | null
  rede_twitter: string | null
  rede_tiktok: string | null
  rede_telegram: string | null
  created_at: string
}

export type PixTipo = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

/** Dados sensíveis do perfil — fora de `profiles` (que é lida publicamente).
 *  Tabela `profile_private`, RLS só do dono + admin. Ver supabase/profile-privado.sql. */
export interface ProfilePrivate {
  profile_id: string
  pix_tipo: PixTipo | null
  pix_chave: string | null
  documento_url: string | null
  video_verificacao_url: string | null
}

/** Rótulos legíveis dos tipos de chave Pix. */
export const PIX_TIPOS: Array<{ valor: PixTipo; rotulo: string }> = [
  { valor: 'cpf', rotulo: 'CPF' },
  { valor: 'cnpj', rotulo: 'CNPJ' },
  { valor: 'email', rotulo: 'E-mail' },
  { valor: 'telefone', rotulo: 'Telefone' },
  { valor: 'aleatoria', rotulo: 'Chave aleatória' },
]

export interface VipMedia {
  id: string
  profile_id: string
  path: string
  tipo: 'image' | 'video'
  ordem: number
  tamanho: 'pequeno' | 'grande'
  created_at: string
}

export interface VipComment {
  id: string
  profile_id: string
  media_id: string | null
  author_id: string
  autor_nome: string | null
  texto: string
  created_at: string
}

export type WalletStatus = 'confirmado' | 'pendente' | 'processando' | 'pago' | 'rejeitado'

export interface WalletEntry {
  id: string
  profile_id: string
  tipo: 'credito' | 'saque'
  valor: number
  descricao: string | null
  status: WalletStatus
  created_at: string
}

export type PlanoSlug = 'prata' | 'ouro' | 'diamante' | 'ruby'

export interface ProfilePhoto {
  id: string
  profile_id: string
  url: string
  ordem: number
  is_capa: boolean
  tipo: 'image' | 'video'
  tamanho: 'pequeno' | 'grande'
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

export interface Fetiche {
  id: string
  slug: string
  nome: string
}

export type GrupoCaracteristica =
  | 'persona'
  | 'servico'
  | 'conteudo'
  | 'local'
  | 'disponibilidade'
  | 'cliente'
  | 'idioma'
  | 'regra'

export interface Caracteristica {
  id: string
  grupo: GrupoCaracteristica
  slug: string
  nome: string
  ordem: number
}

/** Rótulos legíveis de cada grupo de características. */
export const GRUPOS_CARAC: Array<{ grupo: GrupoCaracteristica; titulo: string }> = [
  { grupo: 'persona', titulo: 'Estilo / Persona' },
  { grupo: 'servico', titulo: 'Serviços / Atendimento' },
  { grupo: 'conteudo', titulo: 'Conteúdo digital' },
  { grupo: 'local', titulo: 'Onde atende' },
  { grupo: 'disponibilidade', titulo: 'Disponível para' },
  { grupo: 'cliente', titulo: 'Atende' },
  { grupo: 'idioma', titulo: 'Idiomas' },
  { grupo: 'regra', titulo: 'Observações / Regras' },
]

export type ElogioStatus = 'pending' | 'approved' | 'rejected'

/** Linha completa (uso admin — inclui e-mail e status). */
export interface Elogio {
  id: string
  profile_id: string | null
  nome: string | null
  email: string | null
  mensagem: string
  status: ElogioStatus
  created_at: string
}

/** Versão pública (view elogios_publicos) — sem e-mail, só aprovados. */
export interface ElogioPublico {
  id: string
  profile_id: string | null
  nome: string | null
  mensagem: string
  created_at: string
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
