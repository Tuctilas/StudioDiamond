import { useEffect, useState } from 'react'
import { Navigate, createFileRoute } from '@tanstack/react-router'

import { cidadePorSlug } from '#/lib/cidades'
import { supabase } from '#/lib/supabase'
import type { Profile } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/admin')({
  component: Moderacao,
})

function Moderacao() {
  const { loading, isAdmin } = useAuth()
  const [aba, setAba] = useState<'pending' | 'active' | 'paused'>('pending')
  const [lista, setLista] = useState<Profile[]>([])

  useEffect(() => {
    if (!isAdmin) return
    recarregarEffect()
    async function recarregarEffect() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', aba)
        .order('created_at', { ascending: false })
      setLista(data ?? [])
    }
  }, [isAdmin, aba])

  if (loading) return <p className="text-sm text-muted">Carregando…</p>
  if (!isAdmin) return <Navigate to="/painel" />

  async function mudarStatus(p: Profile, status: string) {
    await supabase.from('profiles').update({ status }).eq('id', p.id)
    setLista((l) => l.filter((x) => x.id !== p.id))
  }
  async function alternarDestaque(p: Profile) {
    await supabase.from('profiles').update({ destaque: !p.destaque }).eq('id', p.id)
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, destaque: !x.destaque } : x)))
  }
  async function excluir(p: Profile) {
    if (!confirm(`Excluir "${p.nome_exibicao}" definitivamente?`)) return
    await supabase.from('profiles').delete().eq('id', p.id)
    setLista((l) => l.filter((x) => x.id !== p.id))
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Moderação</h1>
      <div className="mt-5 flex gap-2 text-sm">
        {(
          [
            ['pending', '⏳ Pendentes'],
            ['active', '✅ Publicados'],
            ['paused', '⏸ Pausados'],
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
        {lista.map((p) => {
          const cidade = p.cidade ? cidadePorSlug(p.cidade) : undefined
          return (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-noir-900 px-5 py-4"
            >
              <div>
                <div className="font-display text-lg">
                  {p.nome_exibicao}
                  {p.destaque && <span className="ml-2 text-xs text-gold-400">⭐ destaque</span>}
                </div>
                <div className="text-xs text-muted">
                  /{p.slug} · {cidade ? `${cidade.nome} · ${cidade.estado}` : 'sem cidade'} ·{' '}
                  {p.idade ? `${p.idade} anos` : 'sem idade'} ·{' '}
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {aba !== 'active' && (
                  <button
                    onClick={() => mudarStatus(p, 'active')}
                    className="rounded-lg border border-emerald-500/50 px-3 py-1.5 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Aprovar
                  </button>
                )}
                {aba === 'active' && (
                  <>
                    <button
                      onClick={() => alternarDestaque(p)}
                      className="rounded-lg border border-gold-500/50 px-3 py-1.5 text-gold-400 hover:bg-gold-500/10"
                    >
                      {p.destaque ? 'Tirar destaque' : '⭐ Destacar'}
                    </button>
                    <button
                      onClick={() => mudarStatus(p, 'paused')}
                      className="rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
                    >
                      Pausar
                    </button>
                  </>
                )}
                <button
                  onClick={() => excluir(p)}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-red-400 hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
        {!lista.length && <p className="py-8 text-sm text-muted">Nada aqui.</p>}
      </div>
    </div>
  )
}
