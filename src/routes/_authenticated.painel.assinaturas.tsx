import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { ProfileCard } from '#/components/ProfileCard'
import {
  getCategoriasDeProfiles,
  getMinhasAssinaturas,
  getSugestoesParaAssinante,
} from '#/lib/queries'
import type { AssinaturaComModelo, ProfileComCapa } from '#/lib/queries'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/assinaturas')({
  component: MinhasAssinaturas,
})

function MinhasAssinaturas() {
  const { user } = useAuth()
  const [assinaturas, setAssinaturas] = useState<AssinaturaComModelo[]>([])
  const [sugestoes, setSugestoes] = useState<ProfileComCapa[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancel = false
    async function carregar() {
      const assina = await getMinhasAssinaturas()
      if (cancel) return
      setAssinaturas(assina)

      const ids = assina.map((a) => a.profile_id)
      const cats = await getCategoriasDeProfiles(ids)
      const sug = await getSugestoesParaAssinante(ids, cats, 6)
      if (cancel) return
      setSugestoes(sug)
      setCarregando(false)
    }
    carregar()
    return () => {
      cancel = true
    }
  }, [user])

  async function cancelar(a: AssinaturaComModelo) {
    const nome = a.modelo?.nome_exibicao ?? 'esta modelo'
    if (!window.confirm(`Cancelar sua assinatura de ${nome}? Você perde o acesso ao conteúdo.`))
      return
    const { error } = await supabase.rpc('cancelar_vip', { p_profile_id: a.profile_id })
    if (!error) setAssinaturas((lista) => lista.filter((x) => x.id !== a.id))
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>

  return (
    <div>
      <h1 className="font-display text-3xl">Minhas assinaturas</h1>
      <p className="mt-1 text-sm text-muted">
        Acesse o conteúdo exclusivo das modelos que você assina.
      </p>

      {assinaturas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
          Você ainda não assina nenhuma modelo.{' '}
          <Link to="/acompanhantes" className="text-gold-400 underline">
            Explorar acompanhantes →
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {assinaturas.map((a) => {
            const m = a.modelo
            const expira = new Date(a.expira).toLocaleDateString('pt-BR')
            return (
              <div
                key={a.id}
                className="flex items-center gap-4 rounded-2xl border border-line bg-noir-900 p-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-noir-700">
                  {m?.capa_url && (
                    <img src={m.capa_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-gold-300">
                    {m?.nome_exibicao ?? 'Modelo indisponível'}
                  </div>
                  <div className="text-xs">
                    {a.ativa ? (
                      <span className="text-emerald-400">Ativa até {expira}</span>
                    ) : (
                      <span className="text-red-400">Expirou em {expira}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {m ? (
                    <Link
                      to="/acompanhantes/$slug"
                      params={{ slug: m.slug }}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        a.ativa
                          ? 'border border-gold-500/50 text-gold-300 hover:bg-gold-500/10'
                          : 'bg-gradient-to-r from-gold-500 to-gold-700 text-white hover:brightness-110'
                      }`}
                    >
                      {a.ativa ? 'Acessar conteúdo' : 'Renovar'}
                    </Link>
                  ) : null}
                  <button
                    onClick={() => cancelar(a)}
                    className="text-xs text-muted underline transition hover:text-red-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sugestoes.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl">Você também pode gostar</h2>
          <p className="mt-1 text-sm text-muted">
            Modelos com o mesmo estilo das que você já assina.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {sugestoes.map((p) => (
              <ProfileCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
