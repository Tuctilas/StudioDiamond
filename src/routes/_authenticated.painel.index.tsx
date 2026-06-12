import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import type { Profile } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/')({
  component: Dashboard,
})

const STATUS_LABEL: Record<string, { txt: string; cor: string }> = {
  pending: { txt: '⏳ Aguardando aprovação', cor: 'text-yellow-400' },
  active: { txt: '✅ Publicado', cor: 'text-emerald-400' },
  paused: { txt: '⏸ Pausado', cor: 'text-muted' },
}

function Dashboard() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<Profile | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPerfil(data)
        setCarregando(false)
      })
  }, [user])

  async function alternarPausa() {
    if (!perfil) return
    const novo = perfil.status === 'paused' ? 'pending' : 'paused'
    const { data } = await supabase
      .from('profiles')
      .update({ status: novo })
      .eq('id', perfil.id)
      .select()
      .maybeSingle()
    if (data) setPerfil(data)
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>

  if (!perfil) {
    return (
      <div className="rounded-2xl border border-line bg-noir-900 p-10 text-center">
        <h1 className="font-display text-2xl">Bem-vinda ao Studio Diamond!</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Seu anúncio ainda não existe. Monte seu perfil com fotos, valores e
          contato — depois da aprovação ele aparece para todo o Brasil.
        </p>
        <Link
          to="/painel/perfil"
          className="mt-6 inline-block rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 font-semibold text-white transition hover:brightness-110"
        >
          Criar meu perfil →
        </Link>
      </div>
    )
  }

  const st = STATUS_LABEL[perfil.status] ?? STATUS_LABEL.pending

  return (
    <div>
      <h1 className="font-display text-3xl">Olá, {perfil.nome_exibicao}</h1>
      <div className={`mt-2 text-sm font-semibold ${st.cor}`}>{st.txt}</div>
      {perfil.status === 'pending' && (
        <p className="mt-1 text-xs text-muted">
          A moderação confere seu documento e aprova o anúncio. Você será
          notificada por e-mail.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/painel/perfil"
          className="rounded-2xl border border-line bg-noir-900 p-6 transition hover:border-gold-500/50"
        >
          <div className="text-2xl">📝</div>
          <div className="mt-2 font-display text-lg">Editar perfil</div>
          <div className="mt-1 text-xs text-muted">Dados, valores, contato e categorias.</div>
        </Link>
        <Link
          to="/painel/fotos"
          className="rounded-2xl border border-line bg-noir-900 p-6 transition hover:border-gold-500/50"
        >
          <div className="text-2xl">📷</div>
          <div className="mt-2 font-display text-lg">Galeria</div>
          <div className="mt-1 text-xs text-muted">Enviar, remover e escolher a capa.</div>
        </Link>
        <button
          onClick={alternarPausa}
          className="rounded-2xl border border-line bg-noir-900 p-6 text-left transition hover:border-gold-500/50"
        >
          <div className="text-2xl">{perfil.status === 'paused' ? '▶' : '⏸'}</div>
          <div className="mt-2 font-display text-lg">
            {perfil.status === 'paused' ? 'Reativar anúncio' : 'Pausar anúncio'}
          </div>
          <div className="mt-1 text-xs text-muted">
            {perfil.status === 'paused'
              ? 'Volta para a fila de aprovação.'
              : 'Sai do ar imediatamente.'}
          </div>
        </button>
      </div>

      {perfil.status === 'active' && (
        <Link
          to="/acompanhantes/$slug"
          params={{ slug: perfil.slug }}
          className="mt-6 inline-block text-sm text-gold-400 underline"
        >
          Ver meu anúncio público →
        </Link>
      )}
    </div>
  )
}
