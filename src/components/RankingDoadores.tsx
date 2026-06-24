import { useEffect, useState } from 'react'

import { fmtBRL, supabase } from '#/lib/supabase'

type Linha = { apelido: string; total: number; qtd: number }

/** Ranking público dos maiores doadores de presentes de uma modelo. */
export function RankingDoadores({ profileId }: { profileId: string }) {
  const [linhas, setLinhas] = useState<Linha[]>([])

  useEffect(() => {
    let cancel = false
    supabase.rpc('ranking_doadores', { p_profile_id: profileId, p_limite: 10 }).then(({ data }) => {
      if (!cancel) setLinhas((data as Linha[]) ?? [])
    })
    return () => {
      cancel = true
    }
  }, [profileId])

  if (linhas.length === 0) return null

  const medalha = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`)

  return (
    <section className="mt-10 rounded-3xl border border-gold-500/30 bg-noir-900/40 p-6">
      <h2 className="font-display text-2xl text-gold-300">👑 Maiores doadores</h2>
      <p className="mt-1 text-sm text-muted">Quem mais apoia com presentes.</p>
      <ol className="mt-4 space-y-2">
        {linhas.map((l, i) => (
          <li
            key={i}
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
              i === 0 ? 'border-gold-500/50 bg-gold-500/10' : 'border-line bg-noir-800'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="w-7 text-center font-display text-lg">{medalha(i)}</span>
              <span className="text-ink">{l.apelido}</span>
            </span>
            <span className="font-display text-gold-300">{fmtBRL(Number(l.total))}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
