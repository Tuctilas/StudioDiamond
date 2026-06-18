import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { PLANOS, PLANO_SELO } from '#/lib/planos'
import { supabase } from '#/lib/supabase'
import type { PlanoSlug } from '#/lib/supabase'
import { fmtBRL } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/plano')({
  component: ContratarPlano,
})

function ContratarPlano() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [planoAtual, setPlanoAtual] = useState<PlanoSlug | null>(null)
  const [expira, setExpira] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  // checkout
  const [escolhido, setEscolhido] = useState<PlanoSlug | null>(null)
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [pix, setPix] = useState<{ payload: string; image: string; invoiceUrl: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancel = false
    async function carregar() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, plano, plano_expira')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (cancel) return
      if (p) {
        setPerfilId(p.id)
        setPlanoAtual(p.plano)
        setExpira(p.plano_expira)
      }
      setCarregando(false)
    }
    carregar()
    return () => {
      cancel = true
    }
  }, [user])

  // Após gerar o Pix, checa a cada 4s se o plano foi aplicado (webhook) e recarrega.
  useEffect(() => {
    if (!pix || !perfilId || !escolhido) return
    const t = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('plano')
        .eq('id', perfilId)
        .maybeSingle()
      if (data && data.plano === escolhido) {
        clearInterval(t)
        window.location.reload()
      }
    }, 4000)
    return () => clearInterval(t)
  }, [pix, perfilId, escolhido])

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>
  if (!perfilId) {
    return (
      <div className="rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
        Crie seu perfil primeiro.{' '}
        <Link to="/painel/perfil" className="text-gold-400 underline">
          Criar perfil →
        </Link>
      </div>
    )
  }

  async function gerarPix() {
    setMsg('')
    const doc = cpf.replace(/\D/g, '')
    if (nome.trim().length < 3) {
      setMsg('Informe seu nome completo.')
      return
    }
    if (doc.length !== 11 && doc.length !== 14) {
      setMsg('Informe um CPF (11 dígitos) ou CNPJ (14) válido.')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('asaas-criar-cobranca', {
      body: { tipo: 'plano', plano: escolhido, nome: nome.trim(), cpfCnpj: doc },
    })
    setBusy(false)
    if (error || data?.error) {
      setMsg(data?.error ?? error?.message ?? 'Não foi possível gerar o Pix.')
      return
    }
    setPix({ payload: data.pixPayload, image: data.pixImage, invoiceUrl: data.invoiceUrl })
  }

  async function copiar() {
    if (!pix) return
    await navigator.clipboard.writeText(pix.payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Plano de vitrine</h1>
      <div className="mt-2 text-sm">
        {planoAtual ? (
          <span className="text-emerald-400">
            Plano atual: <b className="uppercase">{planoAtual}</b>
            {expira ? ` · válido até ${new Date(expira).toLocaleDateString('pt-BR')}` : ''}
          </span>
        ) : (
          <span className="text-muted">Você ainda não tem um plano ativo.</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        Pagando, o plano é aplicado automaticamente. Seu anúncio vai ao ar após a verificação
        do seu documento pela moderação.
      </p>

      {/* PIX GERADO */}
      {pix ? (
        <div className="mt-8 mx-auto max-w-sm rounded-2xl border border-line bg-noir-950/60 p-8 text-center">
          <p className="font-display text-lg text-ink">Escaneie para pagar o plano</p>
          <p className="mt-1 text-xs text-muted">O plano é aplicado sozinho assim que o pagamento cair.</p>
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
            <a href={pix.invoiceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-muted underline">
              Abrir página de pagamento
            </a>
          )}
          <p className="mt-4 animate-pulse text-xs text-muted">Aguardando pagamento…</p>
        </div>
      ) : escolhido ? (
        /* DADOS DO PAGADOR */
        <div className="mt-8 mx-auto max-w-sm">
          <p className="text-center font-display text-lg text-ink">
            Pagar plano {escolhido.toUpperCase()} via Pix
          </p>
          <p className="mt-1 mb-4 text-center text-xs text-muted">
            Precisamos do seu nome e CPF para emitir a cobrança.
          </p>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Nome completo</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mb-3 w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">CPF</label>
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            inputMode="numeric"
            placeholder="000.000.000-00"
            className="w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setEscolhido(null)}
              className="rounded-xl border border-line px-4 py-3 text-sm text-muted transition hover:text-ink"
            >
              Voltar
            </button>
            <button
              onClick={gerarPix}
              disabled={busy}
              className="flex-1 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? 'Gerando Pix…' : 'Gerar Pix'}
            </button>
          </div>
          {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
        </div>
      ) : (
        /* GRADE DE PLANOS */
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANOS.map((p) => {
            return (
              <div
                key={p.slug}
                className={`relative flex flex-col rounded-2xl border bg-noir-900/60 p-5 ${
                  p.popular ? 'border-gold-500/60 shadow-lg shadow-gold-700/10' : 'border-line'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-noir-950">
                    Recomendado
                  </span>
                )}
                <span className={`w-fit rounded-full bg-gradient-to-r px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${PLANO_SELO[p.slug]}`}>
                  {p.nome}
                </span>
                <p className="mt-3 text-xs text-muted">{p.resumo}</p>
                <div className="mt-3">
                  <div className="font-display text-2xl text-gold-300">
                    {fmtBRL(p.precoMes)}
                    <span className="text-xs font-normal text-muted"> / mês</span>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  {p.vendeConteudo ? (
                    <span className="text-emerald-400">
                      Venda de conteúdo {p.taxaVendaPct === 0 ? '· 0% de taxa' : `· ${p.taxaVendaPct}% de taxa`}
                    </span>
                  ) : (
                    <span className="text-muted">Sem venda de conteúdo</span>
                  )}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-0.5 text-gold-400">✦</span>
                      <span className="text-ink/90">{b}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    setEscolhido(p.slug)
                    setMsg('')
                  }}
                  className="mt-5 rounded-xl border border-gold-500/40 px-4 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-gold-500/10"
                >
                  {planoAtual === p.slug ? 'Renovar' : 'Contratar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
