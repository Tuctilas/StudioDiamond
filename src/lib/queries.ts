import { supabase } from './supabase'
import type {
  Caracteristica,
  Category,
  ElogioPublico,
  Fetiche,
  Profile,
  ProfilePhoto,
} from './supabase'

export interface ProfileComCapa extends Profile {
  capa_url: string | null
  capa_foco_x: number
  capa_foco_y: number
}

function comCapa(rows: any[]): ProfileComCapa[] {
  return (rows ?? []).map((p) => {
    const fotos: ProfilePhoto[] = p.profile_photos ?? []
    // A capa do card é sempre uma foto (nunca um vídeo da galeria).
    const imagens = fotos.filter((f) => f.tipo !== 'video')
    const capa = imagens.find((f) => f.is_capa) ?? imagens[0]
    return {
      ...p,
      capa_url: capa?.url ?? null,
      capa_foco_x: capa?.foco_x ?? 50,
      capa_foco_y: capa?.foco_y ?? 50,
    }
  })
}

const SELECT_COM_FOTOS = '*, profile_photos(id, url, ordem, is_capa, tipo, tamanho, foco_x, foco_y)'

export async function getDestaques(): Promise<ProfileComCapa[]> {
  const { data } = await supabase
    .from('profiles')
    .select(SELECT_COM_FOTOS)
    .eq('status', 'active')
    .or('destaque.eq.true,plano_rank.gte.2')
    .order('plano_rank', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8)
  return comCapa(data ?? [])
}

export interface FiltrosListagem {
  cidade?: string[]
  categoria?: string[]
  fetiche?: string[]
  idadeMax?: number
  precoMin?: number
  precoMax?: number
}

export async function getProfiles(f: FiltrosListagem = {}): Promise<ProfileComCapa[]> {
  const select = [SELECT_COM_FOTOS]
  if (f.categoria?.length) select.push('profile_categories!inner(category_id, categories!inner(slug))')
  if (f.fetiche?.length) select.push('profile_fetiches!inner(fetiche_id, fetiches!inner(slug))')
  let q = supabase
    .from('profiles')
    .select(select.join(', '))
    .eq('status', 'active')
    .order('plano_rank', { ascending: false })
    .order('destaque', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)
  // Dentro de cada filtro a seleção é OR (qualquer uma das opções marcadas).
  if (f.cidade?.length) q = q.in('cidade', f.cidade)
  if (f.categoria?.length) q = q.in('profile_categories.categories.slug', f.categoria)
  if (f.fetiche?.length) q = q.in('profile_fetiches.fetiches.slug', f.fetiche)
  if (f.idadeMax) q = q.lte('idade', f.idadeMax)
  if (f.precoMin) q = q.gte('preco_hora', f.precoMin)
  if (f.precoMax) q = q.lte('preco_hora', f.precoMax)
  const { data } = await q
  return comCapa(data ?? [])
}

export interface PerfilCompleto extends Profile {
  fotos: ProfilePhoto[]
  categorias: Category[]
  fetiches: Fetiche[]
  caracteristicas: Caracteristica[]
}

export async function getProfileBySlug(slug: string): Promise<PerfilCompleto | null> {
  const { data } = await supabase
    .from('profiles')
    .select(
      '*, profile_photos(id, profile_id, url, ordem, is_capa, tipo, tamanho, foco_x, foco_y), profile_categories(categories(id, slug, nome)), profile_fetiches(fetiches(id, slug, nome)), profile_caracteristicas(caracteristicas(id, grupo, slug, nome, ordem))',
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!data) return null
  const fotos = ((data as any).profile_photos ?? []).sort(
    (a: ProfilePhoto, b: ProfilePhoto) => a.ordem - b.ordem,
  )
  const categorias = ((data as any).profile_categories ?? [])
    .map((pc: any) => pc.categories)
    .filter(Boolean)
  const fetiches = ((data as any).profile_fetiches ?? [])
    .map((pf: any) => pf.fetiches)
    .filter(Boolean)
  const caracteristicas: Caracteristica[] = ((data as any).profile_caracteristicas ?? [])
    .map((pc: any) => pc.caracteristicas)
    .filter(Boolean)
    .sort((a: Caracteristica, b: Caracteristica) => a.ordem - b.ordem)
  return { ...(data as any), fotos, categorias, fetiches, caracteristicas }
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('nome')
  return data ?? []
}

export async function getFetiches(): Promise<Fetiche[]> {
  const { data } = await supabase.from('fetiches').select('*').order('nome')
  return data ?? []
}

export async function getCaracteristicas(): Promise<Caracteristica[]> {
  const { data } = await supabase
    .from('caracteristicas')
    .select('*')
    .order('grupo')
    .order('ordem')
  return (data ?? []) as Caracteristica[]
}

/** Elogios aprovados (view pública, sem e-mail). Opcionalmente de uma modelo. */
export async function getElogiosPublicos(profileId?: string): Promise<ElogioPublico[]> {
  let q = supabase
    .from('elogios_publicos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(profileId ? 20 : 60)
  if (profileId) q = q.eq('profile_id', profileId)
  const { data } = await q
  return (data ?? []) as ElogioPublico[]
}

/** Envia um elogio (entra como pendente, aguardando moderação). */
export async function enviarElogio(input: {
  mensagem: string
  nome?: string | null
  email?: string | null
  profile_id?: string | null
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('elogios').insert({
    mensagem: input.mensagem,
    nome: input.nome || null,
    email: input.email || null,
    profile_id: input.profile_id || null,
  })
  return { error: error?.message ?? null }
}

export interface AssinaturaComModelo {
  id: string
  profile_id: string
  inicio: string
  expira: string
  ativa: boolean
  modelo: ProfileComCapa | null
}

/** Assinaturas VIP do usuário logado (RLS já filtra por subscriber_id). */
export async function getMinhasAssinaturas(): Promise<AssinaturaComModelo[]> {
  const { data } = await supabase
    .from('vip_subscriptions')
    .select(`id, profile_id, inicio, expira, profiles(${SELECT_COM_FOTOS})`)
    .order('expira', { ascending: false })
  const agora = Date.now()
  return (data ?? []).map((row: any) => ({
    id: row.id,
    profile_id: row.profile_id,
    inicio: row.inicio,
    expira: row.expira,
    ativa: new Date(row.expira).getTime() > agora,
    modelo: row.profiles ? comCapa([row.profiles])[0] : null,
  }))
}

/** Slugs de categorias de um conjunto de perfis (sem repetição). */
export async function getCategoriasDeProfiles(ids: string[]): Promise<string[]> {
  if (!ids.length) return []
  const { data } = await supabase
    .from('profile_categories')
    .select('categories(slug)')
    .in('profile_id', ids)
  const slugs = (data ?? []).map((r: any) => r.categories?.slug).filter(Boolean)
  return Array.from(new Set(slugs))
}

/**
 * Modelos ativas que vendem conteúdo e compartilham alguma das categorias dadas,
 * para sugerir a quem já assina (exclui as que ele já assina).
 */
export async function getSugestoesParaAssinante(
  excluirIds: string[],
  categoriaSlugs: string[],
  limite = 6,
): Promise<ProfileComCapa[]> {
  if (!categoriaSlugs.length) return []
  let q = supabase
    .from('profiles')
    .select(`${SELECT_COM_FOTOS}, profile_categories!inner(category_id, categories!inner(slug))`)
    .eq('status', 'active')
    .eq('vip_ativo', true)
    .in('profile_categories.categories.slug', categoriaSlugs)
    .order('plano_rank', { ascending: false })
    .limit(limite + excluirIds.length + 12)
  if (excluirIds.length) q = q.not('id', 'in', `(${excluirIds.join(',')})`)
  const { data } = await q
  // O inner join pode repetir o mesmo perfil (uma linha por categoria que casa).
  const vistos = new Set<string>()
  const unicos = (data ?? []).filter((p: any) => {
    if (vistos.has(p.id)) return false
    vistos.add(p.id)
    return true
  })
  return comCapa(unicos).slice(0, limite)
}

/** Slugs de perfis ativos (sitemap) */
export async function getActiveSlugs(): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('slug')
    .eq('status', 'active')
    .limit(2000)
  return (data ?? []).map((r) => r.slug)
}
