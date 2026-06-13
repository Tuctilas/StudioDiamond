import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { CIDADES } from '#/lib/cidades'
import { supabase } from '#/lib/supabase'
import type { Caracteristica, Category, Fetiche } from '#/lib/supabase'
import { GRUPOS_CARAC } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/perfil')({
  component: EditarPerfil,
})

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Opções fixas para os selects do perfil físico
const OPCOES = {
  biotipo: ['Magra', 'Falsa magra', 'Curvilínea', 'Plus size', 'Fitness', 'Atlética'],
  seios: ['Naturais', 'Silicone'],
  cabelo: ['Loiros', 'Morenos', 'Castanhos', 'Ruivos', 'Pretos', 'Coloridos'],
  simNao: ['Sim', 'Não'],
  nivel_cultural: ['Fundamental', 'Médio', 'Superior', 'Graduada', 'Pós-graduada'],
}

const VAZIO = {
  nome_exibicao: '',
  slug: '',
  idade: '',
  cidade: '',
  bairro: '',
  altura: '',
  peso: '',
  manequim: '',
  biotipo: '',
  cabelo: '',
  olhos: '',
  seios: '',
  cintura: '',
  quadril: '',
  pes: '',
  tatuagem: '',
  piercing: '',
  fumante: '',
  signo: '',
  nivel_cultural: '',
  bio: '',
  observacoes: '',
  telefone: '',
  whatsapp: '',
  preco_hora: '',
  preco_2h: '',
  preco_pernoite: '',
  documento_url: '',
  video_verificacao_url: '',
}

function EditarPerfil() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...VAZIO })
  const [cats, setCats] = useState<Category[]>([])
  const [minhasCats, setMinhasCats] = useState<Set<string>>(new Set())
  const [fets, setFets] = useState<Fetiche[]>([])
  const [meusFets, setMeusFets] = useState<Set<string>>(new Set())
  const [caracs, setCaracs] = useState<Caracteristica[]>([])
  const [minhasCaracs, setMinhasCaracs] = useState<Set<string>>(new Set())
  const [aceites, setAceites] = useState({ maioridade: false, direitos: false, termos: false, imagem: false })
  const [termosEm, setTermosEm] = useState<string | null>(null)
  const [verificado, setVerificado] = useState(false)
  const [upMsg, setUpMsg] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    carregarOpcoes()
    async function carregarOpcoes() {
      const [{ data: c }, { data: f }, { data: ca }] = await Promise.all([
        supabase.from('categories').select('*').order('nome'),
        supabase.from('fetiches').select('*').order('nome'),
        supabase.from('caracteristicas').select('*').order('grupo').order('ordem'),
      ])
      setCats(c ?? [])
      setFets(f ?? [])
      setCaracs((ca ?? []) as Caracteristica[])
    }
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select(
        '*, profile_categories(category_id), profile_fetiches(fetiche_id), profile_caracteristicas(caracteristica_id)',
      )
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setPerfilId(data.id)
        const txt = (v: any) => (v != null ? String(v) : '')
        setForm({
          nome_exibicao: data.nome_exibicao ?? '',
          slug: data.slug ?? '',
          idade: txt(data.idade),
          cidade: data.cidade ?? '',
          bairro: data.bairro ?? '',
          altura: data.altura ?? '',
          peso: data.peso ?? '',
          manequim: data.manequim ?? '',
          biotipo: data.biotipo ?? '',
          cabelo: data.cabelo ?? '',
          olhos: data.olhos ?? '',
          seios: data.seios ?? '',
          cintura: data.cintura ?? '',
          quadril: data.quadril ?? '',
          pes: data.pes ?? '',
          tatuagem: data.tatuagem ?? '',
          piercing: data.piercing ?? '',
          fumante: data.fumante ?? '',
          signo: data.signo ?? '',
          nivel_cultural: data.nivel_cultural ?? '',
          bio: data.bio ?? '',
          observacoes: data.observacoes ?? '',
          telefone: data.telefone ?? '',
          whatsapp: data.whatsapp ?? '',
          preco_hora: txt(data.preco_hora),
          preco_2h: txt(data.preco_2h),
          preco_pernoite: data.preco_pernoite ?? '',
          documento_url: data.documento_url ?? '',
          video_verificacao_url: data.video_verificacao_url ?? '',
        })
        setTermosEm(data.termos_aceitos_em ?? null)
        setVerificado(Boolean(data.verificado))
        if (data.termos_aceitos_em) {
          setAceites({ maioridade: true, direitos: true, termos: true, imagem: true })
        }
        setMinhasCats(new Set((data.profile_categories ?? []).map((pc: any) => pc.category_id)))
        setMeusFets(new Set((data.profile_fetiches ?? []).map((pf: any) => pf.fetiche_id)))
        setMinhasCaracs(
          new Set((data.profile_caracteristicas ?? []).map((pc: any) => pc.caracteristica_id)),
        )
      })
  }, [user])

  // características agrupadas por grupo (na ordem de GRUPOS_CARAC)
  const caracsPorGrupo = useMemo(() => {
    const map = new Map<string, Caracteristica[]>()
    for (const c of caracs) {
      const arr = map.get(c.grupo) ?? []
      arr.push(c)
      map.set(c.grupo, arr)
    }
    return map
  }, [caracs])

  // Upload de documento/vídeo para o bucket PRIVADO 'verificacao'
  async function enviarArquivo(
    e: React.ChangeEvent<HTMLInputElement>,
    campo: 'documento_url' | 'video_verificacao_url',
  ) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setUpMsg('Enviando…')
    const path = `${user.id}/${campo}-${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
    const { error } = await supabase.storage.from('verificacao').upload(path, file, { upsert: true })
    if (error) {
      setUpMsg(`Erro no envio: ${error.message}`)
      return
    }
    setForm((f) => ({ ...f, [campo]: path }))
    setUpMsg('✅ Arquivo enviado.')
  }

  function campo(k: keyof typeof form) {
    return {
      value: form[k],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => setForm((f) => ({ ...f, [k]: e.target.value })),
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setMsg('')
    if (!form.nome_exibicao.trim()) {
      setMsg('Informe o nome de exibição.')
      return
    }
    const idade = parseInt(form.idade, 10)
    if (!idade || idade < 18) {
      setMsg('A idade precisa ser 18 ou mais.')
      return
    }
    const todosAceites = aceites.maioridade && aceites.direitos && aceites.termos && aceites.imagem
    if (!todosAceites) {
      setMsg('Para publicar, confirme as quatro declarações em "Verificação e Termos".')
      return
    }
    setBusy(true)
    const termos_aceitos_em = termosEm ?? new Date().toISOString()
    const slug = form.slug.trim()
      ? slugify(form.slug)
      : `${slugify(form.nome_exibicao)}-${form.cidade || 'br'}`
    const t = (v: string) => v.trim() || null
    const num = (v: string) => (v ? Number(v.replace(/\D/g, '')) : null)
    const payload = {
      user_id: user.id,
      nome_exibicao: form.nome_exibicao.trim(),
      slug,
      idade,
      cidade: form.cidade || null,
      bairro: t(form.bairro),
      altura: t(form.altura),
      peso: t(form.peso),
      manequim: t(form.manequim),
      biotipo: t(form.biotipo),
      cabelo: t(form.cabelo),
      olhos: t(form.olhos),
      seios: t(form.seios),
      cintura: t(form.cintura),
      quadril: t(form.quadril),
      pes: t(form.pes),
      tatuagem: t(form.tatuagem),
      piercing: t(form.piercing),
      fumante: t(form.fumante),
      signo: t(form.signo),
      nivel_cultural: t(form.nivel_cultural),
      bio: t(form.bio),
      observacoes: t(form.observacoes),
      telefone: t(form.telefone),
      whatsapp: t(form.whatsapp),
      preco_hora: num(form.preco_hora),
      preco_2h: num(form.preco_2h),
      preco_pernoite: t(form.preco_pernoite),
      documento_url: form.documento_url || null,
      video_verificacao_url: form.video_verificacao_url || null,
      termos_aceitos_em,
    }
    try {
      const { data, error } = perfilId
        ? await supabase.from('profiles').update(payload).eq('id', perfilId).select().single()
        : await supabase.from('profiles').insert(payload).select().single()
      if (error) throw error
      setPerfilId(data.id)
      setTermosEm(data.termos_aceitos_em ?? termos_aceitos_em)
      setForm((f) => ({ ...f, slug: data.slug }))
      // regrava os conjuntos N:N
      await regravar('profile_categories', 'category_id', data.id, minhasCats)
      await regravar('profile_fetiches', 'fetiche_id', data.id, meusFets)
      await regravar('profile_caracteristicas', 'caracteristica_id', data.id, minhasCaracs)
      setMsg('✅ Perfil salvo! Ele entra no ar após a aprovação da moderação.')
    } catch (err: any) {
      setMsg(
        err?.code === '23505'
          ? 'Esse endereço (slug) já está em uso — escolha outro.'
          : (err?.message ?? 'Erro ao salvar.'),
      )
    }
    setBusy(false)
  }

  async function regravar(tabela: string, coluna: string, profileId: string, ids: Set<string>) {
    await supabase.from(tabela).delete().eq('profile_id', profileId)
    if (ids.size) {
      await supabase
        .from(tabela)
        .insert([...ids].map((id) => ({ profile_id: profileId, [coluna]: id })))
    }
  }

  const input =
    'w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500'

  return (
    <form onSubmit={salvar} className="max-w-3xl">
      <h1 className="font-display text-3xl">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted">
        Tudo que você salvar aqui aparece no seu anúncio público.
      </p>

      <div className="mt-8 space-y-8">
        {/* ───────── IDENTIFICAÇÃO ───────── */}
        <Secao titulo="Identificação">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nome de exibição *">
              <input {...campo('nome_exibicao')} className={input} placeholder="Ex: Maria" />
            </Campo>
            <Campo label="Endereço do anúncio (slug)">
              <input {...campo('slug')} className={input} placeholder="ex: maria-bh (auto)" />
            </Campo>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Idade *">
              <input {...campo('idade')} type="number" min={18} className={input} placeholder="25" />
            </Campo>
            <Campo label="Cidade">
              <select {...campo('cidade')} className={input}>
                <option value="">Escolha…</option>
                {CIDADES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nome} · {c.estado}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Bairro">
              <input {...campo('bairro')} className={input} placeholder="Ex: Savassi" />
            </Campo>
          </div>
        </Secao>

        {/* ───────── PERFIL FÍSICO ───────── */}
        <Secao titulo="Perfil físico">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Altura">
              <input {...campo('altura')} className={input} placeholder="1,70" />
            </Campo>
            <Campo label="Peso">
              <input {...campo('peso')} className={input} placeholder="58" />
            </Campo>
            <Campo label="Manequim">
              <input {...campo('manequim')} className={input} placeholder="38" />
            </Campo>
            <Campo label="Biotipo">
              <SelectOpc campo={campo('biotipo')} opcoes={OPCOES.biotipo} className={input} />
            </Campo>
            <Campo label="Cabelos">
              <SelectOpc campo={campo('cabelo')} opcoes={OPCOES.cabelo} className={input} />
            </Campo>
            <Campo label="Olhos">
              <input {...campo('olhos')} className={input} placeholder="Castanhos" />
            </Campo>
            <Campo label="Seios">
              <SelectOpc campo={campo('seios')} opcoes={OPCOES.seios} className={input} />
            </Campo>
            <Campo label="Cintura">
              <input {...campo('cintura')} className={input} placeholder="64" />
            </Campo>
            <Campo label="Quadril">
              <input {...campo('quadril')} className={input} placeholder="100" />
            </Campo>
            <Campo label="Pés">
              <input {...campo('pes')} className={input} placeholder="36" />
            </Campo>
            <Campo label="Tatuagem">
              <SelectOpc campo={campo('tatuagem')} opcoes={OPCOES.simNao} className={input} />
            </Campo>
            <Campo label="Piercing">
              <SelectOpc campo={campo('piercing')} opcoes={OPCOES.simNao} className={input} />
            </Campo>
            <Campo label="Fumante">
              <SelectOpc campo={campo('fumante')} opcoes={OPCOES.simNao} className={input} />
            </Campo>
            <Campo label="Nível cultural">
              <SelectOpc
                campo={campo('nivel_cultural')}
                opcoes={OPCOES.nivel_cultural}
                className={input}
              />
            </Campo>
            <Campo label="Signo">
              <input {...campo('signo')} className={input} placeholder="Libra" />
            </Campo>
          </div>
        </Secao>

        {/* ───────── VALORES ───────── */}
        <Secao titulo="Valores">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="1 hora (R$)">
              <input {...campo('preco_hora')} inputMode="numeric" className={input} placeholder="500" />
            </Campo>
            <Campo label="2 horas (R$)">
              <input {...campo('preco_2h')} inputMode="numeric" className={input} placeholder="1000" />
            </Campo>
            <Campo label="Pernoite">
              <input {...campo('preco_pernoite')} className={input} placeholder="A combinar" />
            </Campo>
          </div>
        </Secao>

        {/* ───────── CATEGORIAS / FETICHES ───────── */}
        <Secao titulo="Categorias">
          <TagSelector
            options={cats}
            selected={minhasCats}
            onToggle={(id) => setMinhasCats(toggle(minhasCats, id))}
          />
        </Secao>

        <Secao titulo="Fetiches">
          <TagSelector
            options={fets}
            selected={meusFets}
            onToggle={(id) => setMeusFets(toggle(meusFets, id))}
          />
        </Secao>

        {/* ───────── GRUPOS DE CARACTERÍSTICAS ───────── */}
        {GRUPOS_CARAC.map(({ grupo, titulo }) => {
          const opcoes = caracsPorGrupo.get(grupo) ?? []
          if (!opcoes.length) return null
          return (
            <Secao key={grupo} titulo={titulo}>
              <TagSelector
                options={opcoes}
                selected={minhasCaracs}
                onToggle={(id) => setMinhasCaracs(toggle(minhasCaracs, id))}
              />
            </Secao>
          )
        })}

        {/* ───────── TEXTOS ───────── */}
        <Secao titulo="Sobre / Contato">
          <Campo label="Sobre você (bio)">
            <textarea
              {...campo('bio')}
              rows={5}
              className={input}
              placeholder="Conte sobre você, seu atendimento, sua disponibilidade…"
            />
          </Campo>
          <Campo label="Observações / regras (opcional)">
            <textarea
              {...campo('observacoes')}
              rows={3}
              className={input}
              placeholder="Ex: Não atende números confidenciais. Agende com antecedência."
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="WhatsApp">
              <input {...campo('whatsapp')} type="tel" className={input} placeholder="+55 11 99999-9999" />
            </Campo>
            <Campo label="Telefone (opcional)">
              <input {...campo('telefone')} type="tel" className={input} />
            </Campo>
          </div>
        </Secao>

        {/* ───────── VERIFICAÇÃO E TERMOS ───────── */}
        <Secao titulo="Verificação e Termos">
          <p className="text-xs text-muted">
            Para sua segurança e a do site, confirmamos identidade e maioridade antes de publicar.
            Documento e vídeo ficam em <b className="text-ink">área restrita</b> — só a moderação vê.
          </p>

          {verificado && (
            <p className="text-sm text-emerald-400">✓ Conta verificada pela moderação.</p>
          )}
          {termosEm && (
            <p className="text-xs text-muted">
              Termos aceitos em {new Date(termosEm).toLocaleString('pt-BR')}.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Documento com foto (RG/CNH)">
              <label className="block cursor-pointer rounded-xl border border-gold-500/40 px-4 py-3 text-center text-sm text-gold-400 transition hover:bg-gold-500/10">
                {form.documento_url ? '✓ Documento enviado — trocar' : 'Enviar documento'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => enviarArquivo(e, 'documento_url')}
                  className="hidden"
                />
              </label>
            </Campo>
            <Campo label="Vídeo de verificação">
              <label className="block cursor-pointer rounded-xl border border-gold-500/40 px-4 py-3 text-center text-sm text-gold-400 transition hover:bg-gold-500/10">
                {form.video_verificacao_url ? '✓ Vídeo enviado — trocar' : 'Enviar vídeo'}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => enviarArquivo(e, 'video_verificacao_url')}
                  className="hidden"
                />
              </label>
            </Campo>
          </div>
          {upMsg && <p className="text-xs text-gold-400">{upMsg}</p>}

          <div className="space-y-2">
            {(
              [
                ['maioridade', 'Declaro que sou maior de 18 anos.'],
                ['direitos', 'As fotos e vídeos são meus ou tenho autorização/direitos para publicá-los.'],
                ['imagem', 'Autorizo a publicação da minha imagem no Studio Diamond.'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-start gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={aceites[k]}
                  onChange={(e) => setAceites((a) => ({ ...a, [k]: e.target.checked }))}
                  className="mt-1 accent-gold-500"
                />
                <span>{label}</span>
              </label>
            ))}
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={aceites.termos}
                onChange={(e) => setAceites((a) => ({ ...a, termos: e.target.checked }))}
                className="mt-1 accent-gold-500"
              />
              <span>
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-gold-400 underline">
                  Termos de Uso
                </a>
                .
              </span>
            </label>
          </div>
        </Secao>

        {msg && <p className="text-sm text-gold-400">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-8 py-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </div>
    </form>
  )
}

/* ───────────── helpers de UI ───────────── */

function toggle(set: Set<string>, id: string): Set<string> {
  const n = new Set(set)
  if (n.has(id)) n.delete(id)
  else n.add(id)
  return n
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-line bg-noir-900/40 p-5">
      <legend className="px-2 font-display text-lg text-gold-300">{titulo}</legend>
      {children}
    </fieldset>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

function SelectOpc({
  campo,
  opcoes,
  className,
}: {
  campo: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }
  opcoes: string[]
  className: string
}) {
  return (
    <select value={campo.value} onChange={campo.onChange} className={className}>
      <option value="">—</option>
      {opcoes.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function TagSelector({
  options,
  selected,
  onToggle,
}: {
  options: Array<{ id: string; nome: string }>
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.has(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              on ? 'border-gold-500/60 bg-black text-gold-300' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {o.nome}
          </button>
        )
      })}
    </div>
  )
}
