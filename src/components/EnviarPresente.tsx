import { useEffect, useState } from 'react'

import { fmtBRL, supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

type Gift = { id: string; slug: string; nome: string; emoji: string; valor: number }

/** Envio de presente (joia) pago via Pix, com recado, na página de uma modelo. */
export function EnviarPresente({
  profileId,
  nome,
  donoUserId,
}: {
  profileId: string
  nome: string
  donoUserId: string | null
}) {
  const { user } = useAuth()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [sel, setSel] = useState<Gift | null>(null)
  const [etapa, setEtapa] = useState<'catalogo' | 'dados' | 'pix'>('catalogo')
  const [apelido, setApelido] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [anonimo, setAnonimo] = useState(false)
  const [nomePagador, setNomePagador] = useState('')
  const [cpf, setCpf] = useState('')
  const [nasc, setNasc] = useState('')
  const [pix, setPix] = useState<{ payload: string; image: string; invoiceUrl: string } | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [enviado, setEnviado] = useState(false)

  const ehDono = !!user && user.id === donoUserId

  useEffect(() => {
    let cancel = false
    supabase
      .from('gifts')
      .select('id, slug, nome, emoji, valor')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data }) => {
        if (!cancel) setGifts((data as Gift[]) ?? [])
      })
    return () => {
      cancel = true
    }
  }, [])

  // Enquanto o Pix está na tela, checa se o webhook confirmou o presente.
  useEffect(() => {
    if (etapa !== 'pix' || !paymentId) return
    const t = setInterval(async () => {
      const { data } = await supabase
        .from('gift_sends')
        .select('status')
        .eq('asaas_payment_id', paymentId)
        .maybeSingle()
      if (data?.status === 'confirmed') {
        clearInterval(t)
        setEnviado(true)
        setEtapa('catalogo')
        setPix(null)
        setPaymentId(null)
        setSel(null)
        setMensagem('')
        setAnonimo(false)
      }
    }, 4000)
    return () => clearInterval(t)
  }, [etapa, paymentId])

  if (ehDono) return null // a modelo não manda presente pra si mesma

  function escolher(g: Gift) {
    if (!user) {
      window.location.href = '/auth?tipo=cliente'
      return
    }
    setSel(g)
    setMsg('')
    setEnviado(false)
    setEtapa('dados')
  }

  async function gerar() {
    if (!sel) return
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
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('asaas-criar-cobranca', {
      body: {
        tipo: 'presente',
        profile_id: profileId,
        gift: sel.slug,
        mensagem: mensagem.trim(),
        apelido: apelido.trim() || nomePagador.trim(),
        anonimo,
        nome: nomePagador.trim(),
        cpfCnpj: doc,
        dataNascimento: nasc,
      },
    })
    setBusy(false)
    if (error || data?.error) {
      setMsg(data?.error ?? error?.message ?? 'Não foi possível gerar o Pix.')
      return
    }
    setPix({ payload: data.pixPayload, image: data.pixImage, invoiceUrl: data.invoiceUrl })
    setPaymentId(data.paymentId)
    setEtapa('pix')
  }

  async function copiar() {
    if (!pix) return
    await navigator.clipboard.writeText(pix.payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <section className="mt-10 rounded-3xl border border-gold-500/30 bg-gradient-to-b from-gold-500/10 to-noir-900/40 p-6">
      <h2 className="font-display text-2xl text-gold-300">🎁 Enviar um presente</h2>
      <p className="mt-1 text-sm text-muted">
        Mande uma joia para {nome} com um recado. Ela pode te responder.
      </p>

      {enviado && (
        <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Presente enviado! Obrigado por apoiar {nome} 💛
        </p>
      )}

      {/* CATÁLOGO */}
      {etapa === 'catalogo' && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gifts.map((g) => (
            <button
              key={g.id}
              onClick={() => escolher(g)}
              className="flex flex-col items-center rounded-2xl border border-line bg-noir-800 px-4 py-4 transition hover:border-gold-500/60 hover:bg-gold-500/5"
            >
              <span className="text-3xl">{g.emoji}</span>
              <span className="mt-2 text-sm text-ink">{g.nome}</span>
              <span className="mt-0.5 font-display text-gold-300">{fmtBRL(g.valor)}</span>
            </button>
          ))}
        </div>
      )}

      {/* DADOS + RECADO */}
      {etapa === 'dados' && sel && (
        <div className="mx-auto mt-5 max-w-sm">
          <p className="text-center font-display text-lg text-ink">
            {sel.emoji} {sel.nome} — {fmtBRL(sel.valor)}
          </p>
          <p className="mt-1 mb-4 text-center text-xs text-muted">
            Conteúdo +18. Precisamos do seu nome, CPF e nascimento para emitir o Pix.
          </p>

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Recado (opcional)
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={`Escreva algo para ${nome}…`}
            className="mb-3 w-full resize-none rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Apelido no ranking
          </label>
          <input
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            maxLength={40}
            placeholder="Como você quer aparecer"
            className="mb-2 w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />
          <label className="mb-3 flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
            Não aparecer no ranking público (a modelo ainda vê você)
          </label>

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Nome completo
          </label>
          <input
            value={nomePagador}
            onChange={(e) => setNomePagador(e.target.value)}
            className="mb-3 w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">CPF</label>
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

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                setEtapa('catalogo')
                setSel(null)
              }}
              className="rounded-xl border border-line px-4 py-3 text-sm text-muted transition hover:text-ink"
            >
              Voltar
            </button>
            <button
              onClick={gerar}
              disabled={busy}
              className="flex-1 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? 'Gerando Pix…' : `Enviar ${sel.nome}`}
            </button>
          </div>
          {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
        </div>
      )}

      {/* PIX */}
      {etapa === 'pix' && pix && (
        <div className="mx-auto mt-5 max-w-sm text-center">
          <p className="font-display text-lg text-ink">Escaneie para enviar o presente</p>
          <p className="mt-1 text-xs text-muted">O presente é entregue assim que o pagamento cair.</p>
          {pix.image && (
            <img
              src={`data:image/png;base64,${pix.image}`}
              alt="QR Code Pix"
              className="mx-auto mt-4 h-56 w-56 rounded-xl bg-white p-2"
            />
          )}
          <button
            onClick={copiar}
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
    </section>
  )
}
