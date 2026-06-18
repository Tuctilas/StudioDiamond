import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/assinantes')({
  component: Assinantes,
})

interface Sub {
  id: string
  subscriber_id: string
  inicio: string
  expira: string
}

function Assinantes() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [subs, setSubs] = useState<Sub[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancel = false
    async function carregar() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (p) {
        const { data } = await supabase
          .from('vip_subscriptions')
          .select('id, subscriber_id, inicio, expira')
          .eq('profile_id', p.id)
          .order('expira', { ascending: false })
        if (!cancel) {
          setPerfilId(p.id)
          setSubs((data ?? []) as Sub[])
        }
      }
      if (!cancel) setCarregando(false)
    }
    carregar()
    return () => {
      cancel = true
    }
  }, [user])

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

  const agora = Date.now()
  const ativos = subs.filter((s) => new Date(s.expira).getTime() > agora)

  return (
    <div>
      <h1 className="font-display text-3xl">Assinantes</h1>
      <p className="mt-1 text-sm text-muted">
        Quem assina o seu conteúdo VIP. O valor de cada assinatura cai na sua{' '}
        <Link to="/painel/carteira" className="text-gold-400 underline">
          carteira
        </Link>
        .
      </p>

      <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-transparent p-6">
        <div className="text-xs uppercase tracking-wider text-muted">Assinantes ativos</div>
        <div className="mt-1 font-display text-4xl text-gold-300">{ativos.length}</div>
      </div>

      <div className="mt-6 space-y-2">
        {subs.map((s) => {
          const ativo = new Date(s.expira).getTime() > agora
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-noir-900 px-4 py-3 text-sm"
            >
              <div>
                <div className="text-ink">Assinante #{s.subscriber_id.slice(0, 6)}</div>
                <div className="text-xs text-muted">
                  desde {new Date(s.inicio).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="text-right text-xs">
                {ativo ? (
                  <span className="text-emerald-400">
                    ativo até {new Date(s.expira).toLocaleDateString('pt-BR')}
                  </span>
                ) : (
                  <span className="text-muted">
                    expirou em {new Date(s.expira).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {!subs.length && (
          <p className="py-8 text-center text-sm text-muted">
            Você ainda não tem assinantes. Ative sua área VIP em{' '}
            <Link to="/painel/vip" className="text-gold-400 underline">
              Conteúdo VIP
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  )
}
