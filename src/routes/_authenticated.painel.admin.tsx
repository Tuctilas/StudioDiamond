import { useEffect, useState } from 'react'
import { Navigate, createFileRoute } from '@tanstack/react-router'

import { cidadePorSlug } from '#/lib/cidades'
import { PLANOS } from '#/lib/planos'
import { supabase } from '#/lib/supabase'
import type { PlanoSlug, Profile } from '#/lib/supabase'
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
  async function definirPlano(p: Profile, plano: PlanoSlug | null) {
    await supabase.from('profiles').update({ plano }).eq('id', p.id)
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, plano } : x)))
  }
  async function alternarVerificado(p: Profile) {
    await supabase.from('profiles').update({ verificado: !p.verificado }).eq('id', p.id)
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, verificado: !x.verificado } : x)))
  }
  // Abre um arquivo do bucket privado via URL assinada (válida 2 min).
  async function abrirArquivo(path: string | null) {
    if (!path) return
    const { data } = await supabase.storage.from('verificacao').createSignedUrl(path, 120)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
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
              className="rounded-xl border border-line bg-noir-900 px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <select
                      value={p.plano ?? ''}
                      onChange={(e) => definirPlano(p, (e.target.value || null) as PlanoSlug | null)}
                      className="rounded-lg border border-gold-500/50 bg-noir-800 px-2 py-1.5 text-gold-300"
                      title="Plano de vitrine"
                    >
                      <option value="">Sem plano</option>
                      {PLANOS.map((pl) => (
                        <option key={pl.slug} value={pl.slug}>
                          {pl.nome}
                        </option>
                      ))}
                    </select>
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

              {/* verificação */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs">
                <span className={p.verificado ? 'text-emerald-400' : 'text-muted'}>
                  {p.verificado ? '✓ Verificada' : 'Não verificada'}
                </span>
                {p.termos_aceitos_em && (
                  <span className="text-muted">
                    termos: {new Date(p.termos_aceitos_em).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {p.documento_url && (
                  <button
                    onClick={() => abrirArquivo(p.documento_url)}
                    className="text-gold-400 underline"
                  >
                    ver documento
                  </button>
                )}
                {p.video_verificacao_url && (
                  <button
                    onClick={() => abrirArquivo(p.video_verificacao_url)}
                    className="text-gold-400 underline"
                  >
                    ver vídeo
                  </button>
                )}
                <button
                  onClick={() => alternarVerificado(p)}
                  className="ml-auto rounded-lg border border-emerald-500/40 px-3 py-1.5 text-emerald-400 hover:bg-emerald-500/10"
                >
                  {p.verificado ? 'Desverificar' : 'Marcar verificada'}
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
