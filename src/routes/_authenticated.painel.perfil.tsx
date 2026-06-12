import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { CIDADES } from '#/lib/cidades'
import { supabase } from '#/lib/supabase'
import type { Category } from '#/lib/supabase'
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

function EditarPerfil() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome_exibicao: '',
    slug: '',
    idade: '',
    cidade: '',
    bairro: '',
    altura: '',
    peso: '',
    bio: '',
    telefone: '',
    whatsapp: '',
    preco_hora: '',
  })
  const [cats, setCats] = useState<Category[]>([])
  const [minhasCats, setMinhasCats] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getCategoriesEffect()
    async function getCategoriesEffect() {
      const { data } = await supabase.from('categories').select('*').order('nome')
      setCats(data ?? [])
    }
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*, profile_categories(category_id)')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setPerfilId(data.id)
        setForm({
          nome_exibicao: data.nome_exibicao ?? '',
          slug: data.slug ?? '',
          idade: data.idade != null ? String(data.idade) : '',
          cidade: data.cidade ?? '',
          bairro: data.bairro ?? '',
          altura: data.altura ?? '',
          peso: data.peso ?? '',
          bio: data.bio ?? '',
          telefone: data.telefone ?? '',
          whatsapp: data.whatsapp ?? '',
          preco_hora: data.preco_hora != null ? String(data.preco_hora) : '',
        })
        setMinhasCats(new Set((data.profile_categories ?? []).map((pc: any) => pc.category_id)))
      })
  }, [user])

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
    setBusy(true)
    const slug = form.slug.trim()
      ? slugify(form.slug)
      : `${slugify(form.nome_exibicao)}-${form.cidade || 'br'}`
    const payload = {
      user_id: user.id,
      nome_exibicao: form.nome_exibicao.trim(),
      slug,
      idade,
      cidade: form.cidade || null,
      bairro: form.bairro.trim() || null,
      altura: form.altura.trim() || null,
      peso: form.peso.trim() || null,
      bio: form.bio.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      preco_hora: form.preco_hora ? Number(form.preco_hora.replace(/\D/g, '')) : null,
    }
    try {
      const { data, error } = perfilId
        ? await supabase.from('profiles').update(payload).eq('id', perfilId).select().single()
        : await supabase.from('profiles').insert(payload).select().single()
      if (error) throw error
      setPerfilId(data.id)
      setForm((f) => ({ ...f, slug: data.slug }))
      // categorias: regrava o conjunto
      await supabase.from('profile_categories').delete().eq('profile_id', data.id)
      if (minhasCats.size) {
        await supabase
          .from('profile_categories')
          .insert([...minhasCats].map((category_id) => ({ profile_id: data.id, category_id })))
      }
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

  const input =
    'w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500'

  return (
    <form onSubmit={salvar} className="max-w-2xl">
      <h1 className="font-display text-3xl">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted">
        Tudo que você salvar aqui aparece no seu anúncio público.
      </p>

      <div className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Nome de exibição *
            </label>
            <input {...campo('nome_exibicao')} className={input} placeholder="Ex: Maria" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Endereço do anúncio (slug)
            </label>
            <input {...campo('slug')} className={input} placeholder="ex: maria-bh (auto)" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Idade *
            </label>
            <input {...campo('idade')} type="number" min={18} className={input} placeholder="25" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Cidade
            </label>
            <select {...campo('cidade')} className={input}>
              <option value="">Escolha…</option>
              {CIDADES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nome} · {c.estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Bairro
            </label>
            <input {...campo('bairro')} className={input} placeholder="Ex: Savassi" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Altura
            </label>
            <input {...campo('altura')} className={input} placeholder="1,70 m" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Peso
            </label>
            <input {...campo('peso')} className={input} placeholder="58 kg" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Valor por hora (R$)
            </label>
            <input {...campo('preco_hora')} inputMode="numeric" className={input} placeholder="500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Sobre você (bio)
          </label>
          <textarea
            {...campo('bio')}
            rows={5}
            className={input}
            placeholder="Conte sobre você, seu atendimento, sua disponibilidade…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              WhatsApp
            </label>
            <input {...campo('whatsapp')} type="tel" className={input} placeholder="+55 11 99999-9999" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Telefone (opcional)
            </label>
            <input {...campo('telefone')} type="tel" className={input} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            Categorias
          </label>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => {
              const on = minhasCats.has(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setMinhasCats((s) => {
                      const n = new Set(s)
                      if (n.has(c.id)) n.delete(c.id)
                      else n.add(c.id)
                      return n
                    })
                  }
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    on
                      ? 'border-gold-500/60 bg-black text-gold-300'
                      : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  {c.nome}
                </button>
              )
            })}
          </div>
        </div>

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
