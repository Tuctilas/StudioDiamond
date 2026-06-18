import { useEffect, useState } from 'react'

import { GaleriaItem } from '#/components/GaleriaItem'
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
  // checkout Pix
  const [etapa, setEtapa] = useState<'inicio' | 'dados' | 'pix'>('inicio')
  const [nomePagador, setNomePagador] = useState('')
  const [cpf, setCpf] = useState('')
  const [nasc, setNasc] = useState('')
  const [pix, setPix] = useState<{
    payload: string
    image: string
    invoiceUrl: string
  } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const ehDono = !!user && user.id === donoUserId
  // Marca d'água: identifica quem está vendo (inibe/rastreia vazamento).
  const marca = user?.email ?? ''

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

  // Enquanto o Pix está na tela, checa a cada 4s se o pagamento já foi
  // confirmado pelo webhook (a assinatura passa a existir) e recarrega.
  useEffect(() => {
    if (etapa !== 'pix' || !user) return
    const t = setInterval(async () => {
      const { data: sub } = await supabase
        .from('vip_subscriptions')
        .select('expira')
        .eq('profile_id', profileId)
        .eq('subscriber_id', user.id)
        .maybeSingle()
      if (sub && new Date(sub.expira) > new Date()) {
        clearInterval(t)
        window.location.reload()
      }
    }, 4000)
    return () => clearInterval(t)
  }, [etapa, user, profileId])

  if (!vipAtivo || vipPreco == null) return null

  function iniciarAssinatura() {
    if (!user) {
      window.location.href = '/auth?tipo=cliente'
      return
    }
    setMsg('')
    setEtapa('dados')
  }

  async function gerarPix() {
    setMsg('')
    const doc = cpf.replace(/\D/g, '')
    if (nomePagador.trim().length < 3) {
      setMsg('Informe seu nome completo.')
      return
    }
    if (doc.length !== 11 && doc.length !== 14) {
      setMsg('Informe um CPF (11 dígitos) ou CNPJ (14) válido.')
      return
    }
    const d = new Date(`${nasc}T00:00:00`)
    if (!nasc || Number.isNaN(d.getTime())) {
      setMsg('Informe sua data de nascimento.')
      return
    }
    const hoje = new Date()
    let idade = hoje.getFullYear() - d.getFullYear()
    const mm = hoje.getMonth() - d.getMonth()
    if (mm < 0 || (mm === 0 && hoje.getDate() < d.getDate())) idade--
    if (idade < 18) {
      setMsg('Conteúdo restrito a maiores de 18 anos.')
      return
    }
    setAssinando(true)
    const { data, error } = await supabase.functions.invoke('asaas-criar-cobranca', {
      body: { profile_id: profileId, nome: nomePagador.trim(), cpfCnpj: doc, dataNascimento: nasc },
    })
    setAssinando(false)
    if (error || data?.error) {
      setMsg(data?.error ?? error?.message ?? 'Não foi possível gerar o Pix.')
      return
    }
    setPix({ payload: data.pixPayload, image: data.pixImage, invoiceUrl: data.invoiceUrl })
    setEtapa('pix')
  }

  async function copiarPix() {
    if (!pix) return
    await navigator.clipboard.writeText(pix.payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
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
    <section className="mt-10 rounded-3xl border border-gold-500/30 bg-gradient-to-b from-gold-500/10 to-noir-900/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-gold-300">🔒 Área restrita para membros</h2>
          <p className="mt-1 text-sm text-muted">
            Conteúdo exclusivo de {nome}, disponível para assinantes VIP.
          </p>
        </div>
        {total > 0 && (
          <span className="rounded-full border border-gold-500/40 px-3 py-1 text-xs text-gold-300">
            {total} {total === 1 ? 'conteúdo exclusivo' : 'conteúdos exclusivos'}
          </span>
        )}
      </div>

      {/* BLOQUEADO */}
      {!liberado && (
        <div className="mt-6 rounded-2xl border border-line bg-noir-950/60 p-8 text-center">
          {/* ETAPA 1 — chamada */}
          {etapa === 'inicio' && (
            <>
              <div className="text-4xl">🔐</div>
              <p className="mt-3 font-display text-lg text-ink">
                Assine para ver fotos e vídeos exclusivos
              </p>
              <p className="mt-1 text-sm text-muted">
                Acesso por 30 dias a todo o conteúdo VIP de {nome}.
              </p>
              <button
                onClick={iniciarAssinatura}
                className="mt-5 inline-block rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-7 py-3.5 font-semibold text-white transition hover:brightness-110"
              >
                {`Assinar por ${fmtBRL(vipPreco)} / mês`}
              </button>
              {!user && (
                <p className="mt-2 text-xs text-muted">Você fará login antes de concluir.</p>
              )}
            </>
          )}

          {/* ETAPA 2 — dados do pagador (exigidos pelo Pix) */}
          {etapa === 'dados' && (
            <div className="mx-auto max-w-sm text-left">
              <p className="text-center font-display text-lg text-ink">
                Pagamento via Pix — {fmtBRL(vipPreco)}
              </p>
              <p className="mt-1 mb-4 text-center text-xs text-muted">
                Conteúdo +18. Precisamos do seu nome, CPF e data de nascimento para emitir a
                cobrança e confirmar que você é maior de idade.
              </p>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                Nome completo
              </label>
              <input
                value={nomePagador}
                onChange={(e) => setNomePagador(e.target.value)}
                className="mb-3 w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
              />
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                CPF
              </label>
              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                inputMode="numeric"
                placeholder="000.000.000-00"
                className="mb-3 w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
              />
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                Data de nascimento
              </label>
              <input
                type="date"
                value={nasc}
                onChange={(e) => setNasc(e.target.value)}
                className="w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
              />
              <button
                onClick={gerarPix}
                disabled={assinando}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-7 py-3.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {assinando ? 'Gerando Pix…' : 'Gerar Pix'}
              </button>
            </div>
          )}

          {/* ETAPA 3 — Pix gerado */}
          {etapa === 'pix' && pix && (
            <div className="mx-auto max-w-sm">
              <p className="font-display text-lg text-ink">Escaneie para pagar</p>
              <p className="mt-1 text-xs text-muted">
                Assim que o pagamento for confirmado, o conteúdo libera sozinho.
              </p>
              {pix.image && (
                <img
                  src={`data:image/png;base64,${pix.image}`}
                  alt="QR Code Pix"
                  className="mx-auto mt-4 h-56 w-56 rounded-xl bg-white p-2"
                />
              )}
              <button
                onClick={copiarPix}
                className="mt-4 w-full rounded-xl border border-gold-500/50 px-4 py-3 text-sm text-gold-300 transition hover:bg-gold-500/10"
              >
                {copiado ? '✓ Código copiado' : 'Copiar código Pix (copia e cola)'}
              </button>
              {pix.invoiceUrl && (
                <a
                  href={pix.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-muted underline"
                >
                  Abrir página de pagamento
                </a>
              )}
              <p className="mt-4 animate-pulse text-xs text-muted">Aguardando pagamento…</p>
            </div>
          )}

          {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
        </div>
      )}

      {/* LIBERADO */}
      {liberado && (
        <div className="mt-6">
          {ehDono && (
            <p className="mb-4 text-xs text-gold-300">
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
                <div
                  key={m.id}
                  className={`rounded-2xl border border-line bg-noir-900/60 p-3 ${
                    m.tamanho === 'grande' ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="relative">
                    <GaleriaItem src={m.signedUrl} tipo={m.tipo} grande={m.tamanho === 'grande'} />
                    {marca && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                        <span className="-rotate-[18deg] select-none whitespace-nowrap text-xs font-semibold uppercase tracking-[0.3em] text-white/15">
                          {marca}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* comentários */}
                  <div className="mt-3 space-y-2">
                    {(comentarios[m.id] ?? []).map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                        <p>
                          <span className="text-gold-300">{c.autor_nome || 'Membro'}:</span>{' '}
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
                          className="flex-1 rounded-lg border border-line bg-noir-800 px-3 py-1.5 text-sm outline-none focus:border-gold-500"
                        />
                        <button
                          onClick={() => comentar(m.id)}
                          className="rounded-lg border border-gold-500/50 px-3 py-1.5 text-sm text-gold-300 hover:bg-gold-500/10"
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
