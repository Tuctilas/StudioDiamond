import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { planoPorSlug } from '#/lib/planos'
import { supabase } from '#/lib/supabase'
import type { PlanoSlug, VipComment, VipMedia } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/vip')({
  component: PainelVip,
})

const MAX_VIP = 100

interface PerfilVip {
  id: string
  vip_ativo: boolean
  vip_preco: number | null
  plano: PlanoSlug | null
}

interface Pendente {
  file: File
  preview: string
  tipo: 'image' | 'video'
}

function PainelVip() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilVip | null>(null)
  const [midias, setMidias] = useState<VipMedia[]>([])
  const [comentarios, setComentarios] = useState<VipComment[]>([])
  const [ativo, setAtivo] = useState(false)
  const [preco, setPreco] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [pendentes, setPendentes] = useState<Pendente[]>([])

  useEffect(() => {
    if (!user) return
    carregar()
    async function carregar() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, vip_ativo, vip_preco, plano')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (p) {
        setPerfil(p as PerfilVip)
        setAtivo(Boolean(p.vip_ativo))
        setPreco(p.vip_preco != null ? String(p.vip_preco) : '')
        await recarregar(p.id)
      }
      setCarregando(false)
    }
  }, [user])

  async function recarregar(profileId: string) {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('vip_media').select('*').eq('profile_id', profileId).order('ordem'),
      supabase
        .from('vip_comments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false }),
    ])
    setMidias((m ?? []) as VipMedia[])
    setComentarios((c ?? []) as VipComment[])
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>

  if (!perfil) {
    return (
      <div className="rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
        Crie seu perfil primeiro.{' '}
        <Link to="/painel/perfil" className="text-gold-400 underline">
          Criar perfil →
        </Link>
      </div>
    )
  }

  const plano = planoPorSlug(perfil.plano)
  const podeVender = Boolean(plano?.vendeConteudo)

  if (!podeVender) {
    return (
      <div>
        <h1 className="font-display text-3xl">Conteúdo VIP</h1>
        <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-8 text-center">
          <div className="text-3xl">🔒</div>
          <p className="mt-3 font-display text-lg text-ink">
            Venda de conteúdo disponível a partir do plano Ouro
          </p>
          <p className="mt-1 text-sm text-muted">
            No Ruby a taxa é 0%. Faça upgrade para liberar sua área restrita.
          </p>
          <Link
            to="/anuncie"
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Ver planos →
          </Link>
        </div>
      </div>
    )
  }

  async function salvarConfig() {
    setBusy(true)
    setMsg('')
    const precoNum = preco ? Number(preco.replace(/\D/g, '')) : null
    const { error } = await supabase
      .from('profiles')
      .update({ vip_ativo: ativo, vip_preco: precoNum })
      .eq('id', perfil!.id)
    setBusy(false)
    setMsg(error ? error.message : '✅ Configuração salva.')
    if (!error) setPerfil((p) => (p ? { ...p, vip_ativo: ativo, vip_preco: precoNum } : p))
  }

  // Selecionar NÃO publica: prepara o conteúdo para revisão.
  function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!files.length) return
    if (midias.length + pendentes.length + files.length > MAX_VIP) {
      setMsg(`Limite de ${MAX_VIP} conteúdos VIP no total.`)
      return
    }
    setMsg('')
    setPendentes((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        tipo: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video',
      })),
    ])
  }

  function removerPendente(i: number) {
    setPendentes((prev) => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  function limparPendentes() {
    pendentes.forEach((p) => URL.revokeObjectURL(p.preview))
    setPendentes([])
  }

  // Só aqui o conteúdo vai de fato para a área restrita.
  async function publicar() {
    if (!pendentes.length || !user || !perfil) return
    setBusy(true)
    setMsg('Publicando…')
    let ordem = midias.length
    for (const { file, tipo } of pendentes) {
      const path = `${user.id}/vip-${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
      const { error } = await supabase.storage.from('vip-conteudo').upload(path, file)
      if (error) {
        setMsg(`Erro: ${error.message}`)
        continue
      }
      await supabase.from('vip_media').insert({ profile_id: perfil.id, path, tipo, ordem: ordem++ })
    }
    limparPendentes()
    await recarregar(perfil.id)
    setMsg('✅ Conteúdo publicado.')
    setBusy(false)
  }

  async function removerMidia(m: VipMedia) {
    await supabase.from('vip_media').delete().eq('id', m.id)
    await supabase.storage.from('vip-conteudo').remove([m.path])
    await recarregar(perfil!.id)
  }

  async function alternarTamanhoVip(m: VipMedia) {
    const novo = m.tamanho === 'grande' ? 'pequeno' : 'grande'
    await supabase.from('vip_media').update({ tamanho: novo }).eq('id', m.id)
    setMidias((l) => l.map((x) => (x.id === m.id ? { ...x, tamanho: novo } : x)))
  }

  async function removerComentario(c: VipComment) {
    await supabase.from('vip_comments').delete().eq('id', c.id)
    setComentarios((l) => l.filter((x) => x.id !== c.id))
  }

  const input =
    'w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500'

  return (
    <div>
      <h1 className="font-display text-3xl">Conteúdo VIP</h1>
      <p className="mt-1 text-sm text-muted">
        Sua área restrita. Assinantes pagam {plano?.taxaVendaPct === 0 ? 'sem taxa' : `${plano?.taxaVendaPct}% de taxa`}{' '}
        — você recebe na sua{' '}
        <Link to="/painel/carteira" className="text-gold-400 underline">
          carteira
        </Link>
        .
      </p>

      {/* CONFIG */}
      <div className="mt-6 grid gap-4 rounded-2xl border border-line bg-noir-900/50 p-5 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="accent-gold-500"
            />
            Área VIP ativa
          </label>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Mensalidade VIP (R$)
            </label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              inputMode="numeric"
              className={input}
              placeholder="50"
            />
          </div>
        </div>
        <button
          onClick={salvarConfig}
          disabled={busy}
          className="self-end rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          Salvar
        </button>
      </div>

      {/* UPLOAD */}
      <p className="mt-6 text-sm text-muted">
        O conteúdo só vai para a área restrita depois que você clicar em <b>Publicar</b>.
      </p>
      <label className="mt-2 inline-block cursor-pointer rounded-xl border border-gold-500/40 px-6 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-500/10">
        + Selecionar conteúdo VIP ({midias.length}/{MAX_VIP})
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={selecionar}
          className="hidden"
          disabled={busy}
        />
      </label>
      {msg && <p className="mt-3 text-sm text-gold-400">{msg}</p>}

      {/* PARA PUBLICAR (revisão) */}
      {pendentes.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-gold-300">Para publicar ({pendentes.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={limparPendentes}
                disabled={busy}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink"
              >
                Limpar
              </button>
              <button
                onClick={publicar}
                disabled={busy}
                className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? 'Publicando…' : `Publicar ${pendentes.length} item(ns)`}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {pendentes.map((p, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-gold-500/40">
                {p.tipo === 'video' ? (
                  <video src={p.preview} muted className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <img src={p.preview} alt="" className="aspect-[3/4] w-full object-cover" />
                )}
                <button
                  onClick={() => removerPendente(i)}
                  className="absolute right-1 top-1 rounded-full bg-noir-950/85 px-2 py-0.5 text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PUBLICADOS */}
      {midias.length > 0 && <h2 className="mt-8 font-display text-lg">Publicados</h2>}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {midias.map((m) => (
          <div key={m.id} className="relative rounded-xl border border-line p-2 text-center">
            <div className="flex aspect-[3/4] items-center justify-center rounded bg-noir-800 text-xs text-muted">
              {m.tipo === 'video' ? '🎬 vídeo' : '🖼 foto'}
              {m.tamanho === 'grande' && (
                <span className="ml-1 text-gold-400">· grande</span>
              )}
            </div>
            <div className="mt-2 flex justify-center gap-3 text-xs">
              <button onClick={() => alternarTamanhoVip(m)} className="text-gold-400 hover:underline">
                {m.tamanho === 'grande' ? 'menor' : 'maior'}
              </button>
              <button onClick={() => removerMidia(m)} className="text-red-400 hover:underline">
                remover
              </button>
            </div>
          </div>
        ))}
      </div>
      {!midias.length && !pendentes.length && (
        <p className="mt-6 text-sm text-muted">Nenhum conteúdo VIP ainda.</p>
      )}

      {/* MODERAÇÃO DE COMENTÁRIOS */}
      <h2 className="mt-12 font-display text-2xl">Comentários</h2>
      <p className="mt-1 text-sm text-muted">Remova qualquer comentário que considerar inadequado.</p>
      <div className="mt-4 space-y-2">
        {comentarios.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-line bg-noir-900 px-4 py-3 text-sm"
          >
            <p>
              <span className="text-gold-300">{c.autor_nome || 'Membro'}:</span>{' '}
              <span className="text-ink/90">{c.texto}</span>
            </p>
            <button
              onClick={() => removerComentario(c)}
              className="shrink-0 text-xs text-red-400 hover:underline"
            >
              remover
            </button>
          </div>
        ))}
        {!comentarios.length && <p className="text-sm text-muted">Sem comentários ainda.</p>}
      </div>
    </div>
  )
}
