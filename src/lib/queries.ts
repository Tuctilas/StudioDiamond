import { supabase } from './supabase'
import type { Category, Profile, ProfilePhoto } from './supabase'

export interface ProfileComCapa extends Profile {
  capa_url: string | null
}

function comCapa(rows: any[]): ProfileComCapa[] {
  return (rows ?? []).map((p) => {
    const fotos: ProfilePhoto[] = p.profile_photos ?? []
    const capa = fotos.find((f) => f.is_capa) ?? fotos[0]
    return { ...p, capa_url: capa?.url ?? null }
  })
}

const SELECT_COM_FOTOS = '*, profile_photos(id, url, ordem, is_capa)'

export async function getDestaques(): Promise<ProfileComCapa[]> {
  const { data } = await supabase
    .from('profiles')
    .select(SELECT_COM_FOTOS)
    .eq('status', 'active')
    .eq('destaque', true)
    .order('created_at', { ascending: false })
    .limit(8)
  return comCapa(data ?? [])
}

export interface FiltrosListagem {
  cidade?: string
  categoria?: string
  idadeMax?: number
  precoMax?: number
}

export async function getProfiles(f: FiltrosListagem = {}): Promise<ProfileComCapa[]> {
  let q = supabase
    .from('profiles')
    .select(
      f.categoria
        ? `${SELECT_COM_FOTOS}, profile_categories!inner(category_id, categories!inner(slug))`
        : SELECT_COM_FOTOS,
    )
    .eq('status', 'active')
    .order('destaque', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)
  if (f.cidade) q = q.eq('cidade', f.cidade)
  if (f.categoria) q = q.eq('profile_categories.categories.slug', f.categoria)
  if (f.idadeMax) q = q.lte('idade', f.idadeMax)
  if (f.precoMax) q = q.lte('preco_hora', f.precoMax)
  const { data } = await q
  return comCapa(data ?? [])
}

export interface PerfilCompleto extends Profile {
  fotos: ProfilePhoto[]
  categorias: Category[]
}

export async function getProfileBySlug(slug: string): Promise<PerfilCompleto | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*, profile_photos(id, profile_id, url, ordem, is_capa), profile_categories(categories(id, slug, nome))')
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
  return { ...(data as any), fotos, categorias }
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('nome')
  return data ?? []
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
