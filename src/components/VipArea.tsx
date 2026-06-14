import { useEffect, useState } from 'react'

import { supabase } from '#/lib/supabase'
import type { VipComment, VipMedia } from '#/lib/supabase'
import { fmtBRL } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

type MidiaComUrl = VipMedia & { signedUrl: string }

/** Área restrita (conteúdo VIP) na página de uma modelo. */
export function VipArea({
  profileId,
  nome,
  vipAtivo,
  vipPreco,
  donoUserId,
}: {
  profileId: string
  nome: string
  vipAtivo: boolean
  vipPreco: number | null
  donoUserId: string | null
}) {
  const { user, isAdmin } = useAuth()
  const [total, setTotal] = useState(0)
  const [liberado, setLiberado] = useState(false)
  const [assinante, setAssinante] = useState(false)
  const [midias, setMidias] = useState<MidiaComUrl[]>([])
  const [comentarios, setComentarios] = useState<Record<string, VipComment[]>>({})
  const [rascunho, setRascunho] = useState<Record<string, string>>({})
  const [assinando, setAssinando] = useState(false)
  const [msg, setMsg] = useState('')

  const ehDono = !!user && user.id === donoUserId

  useEffect(() => {
    let cancel = false
    async function carregar() {
      const { data: t } = await supabase.rpc('vip_total', { p_profile: profileId })
      if (!cancel) setTotal(typeof t === 'number' ? t : 0)

      let assina = false
      if (user) {
        const { data: sub } = await supabase
          .from('vip_subscriptions')
          .select('expira')
          .eq('profile_id', profileId)
          .eq('subscriber_id', user.id)
          .maybeSingle()
        assina = !!sub && new Date(sub.expira) > new Date()
      }
      const podeVer = ehDono || isAdmin || assina
      if (cancel) return
      setAssinante(assina)
      setLiberado(podeVer)
      if (!podeVer) return

      const { data: m } = await supabase
        .from('vip_media')
        .select('*')
        .eq('profile_id', profileId)
        .order('ordem')
      const comUrl = await Promise.all(
        (m ?? []).map(async (mid) => {
          const { data: signed } = await supabase.storage
            .from('vip-conteudo')
            .createSignedUrl(mid.path, 3600)
          return { ...(mid as VipMedia), signedUrl: signed?.signedUrl ?? '' }
        }),
      )
      if (cancel) return
      setMidias(comUrl)

      const ids = (m ?? []).map((x: VipMedia) => x.id)
      if (ids.length) {
        const { data: cs } = await supabase
          .from('vip_comments')
          .select('*')
          .in('media_id', ids)
          .order('created_at')
        const grouped: Record<string, VipComment[]> = {}
        for (const c of (cs ?? []) as VipComment[]) (grouped[c.media_id ?? ''] ??= []).push(c)
        if (!cancel) setComentarios(grouped)
      }
    }
    carregar()
    return () => {
      cancel = true
    }
  }, [user, isAdmin, ehDono, profileId])

  if (!vipAtivo || vipPreco == null) return null

  async function assinar() {
    if (!user) {
      window.location.href = '/auth?tipo=cliente'
      return
    }
    setAssinando(true)
    setMsg('')
    const { error } = await supabase.rpc('assinar_vip', { p_profile_id: profileId })
    setAssinando(false)
    if (error) {
      setMsg(error.message)
      return
    }
    window.location.reload()
  }

  async function cancelar() {
    if (!window.confirm(`Cancelar sua assinatura de ${nome}? Você perde o acesso ao conteúdo.`))
      return
    const { error } = await supabase.rpc('cancelar_vip', { p_profile_id: profileId })
    if (error) {
      setMsg(error.message)
      return
    }
    window.location.reload()
  }

  async function comentar(mediaId: string) {
    const texto = (rascunho[mediaId] ?? '').trim()
    if (!texto || !user) return
    const { data, error } = await supabase
      .from('vip_comments')
      .insert({
        profile_id: profileId,
        media_id: mediaId,
        author_id: user.id,
        autor_nome: user.email?.split('@')[0] ?? null,
        texto,
      })
      .select()
      .single()
    if (!error && data) {
      setComentarios((c) => ({ ...c, [mediaId]: [...(c[mediaId] ?? []), data as VipComment] }))
      setRascunho((r) => ({ ...r, [mediaId]: '' }))
    }
  }

  async function removerComentario(mediaId: string, commentId: string) {
    await supabase.from('vip_comments').delete().eq('id', commentId)
    setComentarios((c) => ({
      ...c,
      [mediaId]: (c[mediaId] ?? []).filter((x) => x.id !== commentId),
    }))
  }

  return (
    <section className="mt-10 rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-noir-900/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-rose-200">🔒 Área restrita para membros</h2>
          <p className="mt-1 text-sm text-muted">
            Conteúdo exclusivo de {nome}, disponível para assinantes VIP.
          </p>
        </div>
        {total > 0 && (
          <span className="rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-200">
            {total} {total === 1 ? 'conteúdo exclusivo' : 'conteúdos exclusivos'}
          </span>
        )}
      </div>

      {/* BLOQUEADO */}
      {!liberado && (
        <div className="mt-6 rounded-2xl border border-line bg-noir-950/60 p-8 text-center">
          <div className="text-4xl">🔐</div>
          <p className="mt-3 font-display text-lg text-ink">
            Assine para ver fotos e vídeos exclusivos
          </p>
          <p className="mt-1 text-sm text-muted">
            Acesso por 30 dias a todo o conteúdo VIP de {nome}.
          </p>
          <button
            onClick={assinar}
            disabled={assinando}
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-7 py-3.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {assinando ? 'Processando…' : `Assinar por ${fmtBRL(vipPreco)} / mês`}
          </button>
          {!user && (
            <p className="mt-2 text-xs text-muted">Você fará login antes de concluir.</p>
          )}
          {msg && <p className="mt-2 text-sm text-red-400">{msg}</p>}
        </div>
      )}

      {/* LIBERADO */}
      {liberado && (
        <div className="mt-6">
          {ehDono && (
            <p className="mb-4 text-xs text-rose-200">
              Você está vendo a prévia do seu conteúdo VIP como assinante.
            </p>
          )}
          {assinante && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={cancelar}
                className="text-xs text-muted underline transition hover:text-red-400"
              >
                Cancelar assinatura
              </button>
            </div>
          )}
          {midias.length === 0 ? (
            <p className="text-sm text-muted">Nenhum conteúdo VIP publicado ainda.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {midias.map((m) => (
                <div key={m.id} className="rounded-2xl border border-line bg-noir-900/60 p-3">
                  {m.tipo === 'video' ? (
                    <video
                      src={m.signedUrl}
                      controls
                      controlsList="nodownload"
                      disablePictureInPicture
                      className="w-full rounded-xl"
                    />
                  ) : (
                    <img src={m.signedUrl} alt="" className="w-full rounded-xl" />
                  )}

                  {/* comentários */}
                  <div className="mt-3 space-y-2">
                    {(comentarios[m.id] ?? []).map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                        <p>
                          <span className="text-rose-200">{c.autor_nome || 'Membro'}:</span>{' '}
                          <span className="text-ink/90">{c.texto}</span>
                        </p>
                        {(ehDono || isAdmin || c.author_id === user?.id) && (
                          <button
                            onClick={() => removerComentario(m.id, c.id)}
                            className="shrink-0 text-xs text-red-400 hover:underline"
                          >
                            remover
                          </button>
                        )}
                      </div>
                    ))}
                    {assinante && (
                      <div className="flex gap-2">
                        <input
                          value={rascunho[m.id] ?? ''}
                          onChange={(e) =>
                            setRascunho((r) => ({ ...r, [m.id]: e.target.value }))
                          }
                          placeholder="Comentar…"
                          className="flex-1 rounded-lg border border-line bg-noir-800 px-3 py-1.5 text-sm outline-none focus:border-rose-500"
                        />
                        <button
                          onClick={() => comentar(m.id)}
                          className="rounded-lg border border-rose-500/50 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/10"
                        >
                          Enviar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
