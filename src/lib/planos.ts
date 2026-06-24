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
    precoMes: 490,
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
    precoMes: 350,
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
    precoMes: 190,
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
    precoMes: 90,
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

/**
 * Leva fundadora (promo de lançamento): as 20 primeiras modelos que PAGAREM
 * um plano ganham 70% de desconto nas 3 primeiras mensalidades. Ruby fica de
 * fora. O desconto é cravado no servidor — mantenha em sincronia com a Edge
 * Function `asaas-criar-cobranca` e com `supabase/plano-fundadora.sql`.
 */
export const FUNDADORA = {
  desconto: 0.7,
  vagas: 20,
  meses: 3,
  planos: ['diamante', 'ouro', 'prata'] as PlanoSlug[],
}

/** Preço de um plano já com o desconto de fundadora aplicado. */
export function precoFundadora(precoMes: number): number {
  return Math.round(precoMes * (1 - FUNDADORA.desconto) * 100) / 100
}

/** Cor do selo por plano (classes Tailwind). */
export const PLANO_SELO: Record<PlanoSlug, string> = {
  ruby: 'from-rose-400 to-red-600 text-white',
  diamante: 'from-cyan-200 to-sky-400 text-noir-950',
  ouro: 'from-gold-300 to-gold-500 text-noir-950',
  prata: 'from-zinc-300 to-zinc-400 text-noir-950',
}

