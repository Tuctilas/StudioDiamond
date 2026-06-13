import { useEffect, useState } from 'react'
import { Navigate, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import type { Elogio, ElogioStatus } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/elogios')({
  component: ModeracaoElogios,
})

function ModeracaoElogios() {
  const { loading, isAdmin } = useAuth()
  const [aba, setAba] = useState<ElogioStatus>('pending')
  const [lista, setLista] = useState<Elogio[]>([])

  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('elogios')
      .select('*')
      .eq('status', aba)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLista((data ?? []) as Elogio[]))
  }, [isAdmin, aba])

  if (loading) return <p className="text-sm text-muted">Carregando…</p>
  if (!isAdmin) return <Navigate to="/painel" />

  async function mudar(el: Elogio, status: ElogioStatus) {
    await supabase.from('elogios').update({ status }).eq('id', el.id)
    setLista((l) => l.filter((x) => x.id !== el.id))
  }
  async function excluir(el: Elogio) {
    if (!confirm('Excluir este elogio definitivamente?')) return
    await supabase.from('elogios').delete().eq('id', el.id)
    setLista((l) => l.filter((x) => x.id !== el.id))
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Elogios</h1>
      <p className="mt-1 text-sm text-muted">
        Aprove os depoimentos elegantes; descarte críticas, ofensas ou tentativas de contato.
      </p>

      <div className="mt-5 flex gap-2 text-sm">
        {(
          [
            ['pending', '⏳ Pendentes'],
            ['approved', '✅ Publicados'],
            ['rejected', '🗑 Descartados'],
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
        {lista.map((el) => (
          <div key={el.id} className="rounded-xl border border-line bg-noir-900 px-5 py-4">
            <blockquote className="text-sm leading-relaxed text-ink">“{el.mensagem}”</blockquote>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted">
                <span className="text-gold-400">{el.nome?.trim() || 'Anônimo'}</span>
                {el.email && <span> · {el.email}</span>}
                <span> · {new Date(el.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {aba !== 'approved' && (
                  <button
                    onClick={() => mudar(el, 'approved')}
                    className="rounded-lg border border-emerald-500/50 px-3 py-1.5 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Aprovar
                  </button>
                )}
                {aba !== 'rejected' && (
                  <button
                    onClick={() => mudar(el, 'rejected')}
                    className="rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
                  >
                    Descartar
                  </button>
                )}
                <button
                  onClick={() => excluir(el)}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-red-400 hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
        {!lista.length && <p className="py-8 text-sm text-muted">Nada aqui.</p>}
      </div>
    </div>
  )
}
