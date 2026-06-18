import { useEffect, useState } from 'react'
import { Navigate, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import type { WalletEntry, WalletStatus } from '#/lib/supabase'
import { fmtBRL } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/saques')({
  component: Saques,
})

type SaqueRow = WalletEntry & { profiles: { nome_exibicao: string; slug: string } | null }

function Saques() {
  const { loading, isAdmin } = useAuth()
  const [aba, setAba] = useState<WalletStatus>('pendente')
  const [lista, setLista] = useState<SaqueRow[]>([])
  const [pagandoId, setPagandoId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('wallet_entries')
      .select('*, profiles(nome_exibicao, slug)')
      .eq('tipo', 'saque')
      .eq('status', aba)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLista((data ?? []) as SaqueRow[]))
  }, [isAdmin, aba])

  if (loading) return <p className="text-sm text-muted">Carregando…</p>
  if (!isAdmin) return <Navigate to="/painel" />

  async function mudar(s: SaqueRow, status: WalletStatus) {
    await supabase.from('wallet_entries').update({ status }).eq('id', s.id)
    setLista((l) => l.filter((x) => x.id !== s.id))
  }

  // Paga de verdade via Pix (transfer do Asaas) e marca como pago.
  async function pagar(s: SaqueRow) {
    if (
      !window.confirm(
        `Pagar ${fmtBRL(Number(s.valor))} via Pix para ${s.profiles?.nome_exibicao ?? 'a modelo'}?`,
      )
    )
      return
    setMsg('')
    setPagandoId(s.id)
    const { data, error } = await supabase.functions.invoke('asaas-saque', {
      body: { wallet_entry_id: s.id },
    })
    setPagandoId(null)
    if (error || data?.error) {
      setMsg(data?.error ?? error?.message ?? 'Falha ao pagar via Pix.')
      return
    }
    setLista((l) => l.filter((x) => x.id !== s.id))
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Saques</h1>
      <p className="mt-1 text-sm text-muted">
        Aprove (pague via Pix da modelo) ou rejeite as solicitações de saque.
      </p>
      {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}

      <div className="mt-5 flex gap-2 text-sm">
        {(
          [
            ['pendente', '⏳ Pendentes'],
            ['pago', '✅ Pagos'],
            ['rejeitado', '🗑 Rejeitados'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setAba(k)}
            className={`rounded-full border px-4 py-1.5 transition ${
              aba === k ? 'border-gold-500 bg-black text-gold-300' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {lista.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-noir-900 px-5 py-4"
          >
            <div>
              <div className="font-display text-lg">
                {s.profiles?.nome_exibicao ?? '—'}{' '}
                <span className="text-gold-300">{fmtBRL(Number(s.valor))}</span>
              </div>
              <div className="text-xs text-muted">
                /{s.profiles?.slug} · {new Date(s.created_at).toLocaleString('pt-BR')}
              </div>
            </div>
            {aba === 'pendente' && (
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => pagar(s)}
                  disabled={pagandoId === s.id}
                  className="rounded-lg border border-emerald-500/50 px-3 py-1.5 text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  {pagandoId === s.id ? 'Pagando…' : 'Pagar via Pix'}
                </button>
                <button
                  onClick={() => mudar(s, 'rejeitado')}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-red-400 hover:bg-red-500/10"
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
        {!lista.length && <p className="py-8 text-sm text-muted">Nada aqui.</p>}
      </div>
    </div>
  )
}
