import type { PlanoSlug } from './supabase'

export interface Plano {
  slug: PlanoSlug
  nome: string
  rank: number
  precoMes: number
  /** destaque visual na página de planos */
  popular?: boolean
  /** pode vender conteúdo VIP (Fase 2)? */
  vendeConteudo: boolean
  /** taxa da plataforma sobre as vendas de conteúdo (%) */
  taxaVendaPct: number
  resumo: string
  beneficios: string[]
}

/** Planos de vitrine pagos pela anunciante (Fluxo A). */
export const PLANOS: Plano[] = [
  {
    slug: 'ruby',
    nome: 'Ruby',
    rank: 4,
    precoMes: 1900,
    popular: true,
    vendeConteudo: true,
    taxaVendaPct: 0,
    resumo: 'O topo absoluto — e o único sem taxa nas vendas.',
    beneficios: [
      'Posição máxima: topo da home e das listagens',
      'Venda de conteúdo VIP com 0% de taxa — exclusivo do Ruby (você fica com 100%)',
      'Selo Ruby exclusivo no perfil',
      'Vídeos, áudios e ensaios anteriores',
      'Prioridade máxima de exibição',
    ],
  },
  {
    slug: 'diamante',
    nome: 'Diamante',
    rank: 3,
    precoMes: 1500,
    vendeConteudo: true,
    taxaVendaPct: 15,
    resumo: 'Alto destaque e venda de conteúdo.',
    beneficios: [
      'Banner no topo da página inicial',
      'Venda de conteúdo VIP (15% de taxa)',
      'Selo Diamante no perfil',
      'Vídeos, áudios e ensaios anteriores',
    ],
  },
  {
    slug: 'ouro',
    nome: 'Ouro',
    rank: 2,
    precoMes: 800,
    vendeConteudo: true,
    taxaVendaPct: 15,
    resumo: 'Destaque forte e já com venda de conteúdo.',
    beneficios: [
      'Destaque na página inicial',
      'Venda de conteúdo VIP (15% de taxa)',
      'Selo Ouro no perfil',
      'Vídeos e áudios',
    ],
  },
  {
    slug: 'prata',
    nome: 'Prata',
    rank: 1,
    precoMes: 400,
    vendeConteudo: false,
    taxaVendaPct: 0,
    resumo: 'Sua vitrine publicada e ativa.',
    beneficios: [
      'Perfil completo publicado',
      'Aparece nas listagens e buscas',
      'Galeria de fotos',
      'Venda de conteúdo VIP não incluída',
    ],
  },
]

export function planoPorSlug(slug?: string | null): Plano | undefined {
  return PLANOS.find((p) => p.slug === slug)
}

/** Cor do selo por plano (classes Tailwind). */
export const PLANO_SELO: Record<PlanoSlug, string> = {
  ruby: 'from-rose-400 to-red-600 text-white',
  diamante: 'from-cyan-200 to-sky-400 text-noir-950',
  ouro: 'from-gold-300 to-gold-500 text-noir-950',
  prata: 'from-zinc-300 to-zinc-400 text-noir-950',
}

/** Promoção de lançamento: 30% off para os N primeiros cadastros. */
export const PROMO = { vagas: 20, desconto: 0.3 }

export function precoComPromo(precoMes: number): number {
  return Math.round((precoMes * (1 - PROMO.desconto)) / 10) * 10
}
