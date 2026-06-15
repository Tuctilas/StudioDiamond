import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { planoPorSlug } from '#/lib/planos'
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
  const { user, isCliente, isAdmin } = useAuth()
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

  if (isAdmin) {
    return (
      <div>
        <h1 className="font-display text-3xl">Painel de moderação</h1>
        <p className="mt-1 text-sm text-muted">
          Ferramentas administrativas do Studio Diamond.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            to="/painel/admin"
            className="rounded-2xl border border-line bg-noir-900 p-6 transition hover:border-gold-500/50"
          >
            <div className="text-2xl">🛡️</div>
            <div className="mt-2 font-display text-lg">Moderação</div>
            <div className="mt-1 text-xs text-muted">
              Aprovar anúncios, verificar documentos e gerenciar perfis.
            </div>
          </Link>
          <Link
            to="/painel/elogios"
            className="rounded-2xl border border-line bg-noir-900 p-6 transition hover:border-gold-500/50"
          >
            <div className="text-2xl">✨</div>
            <div className="mt-2 font-display text-lg">Elogios</div>
            <div className="mt-1 text-xs text-muted">
              Aprovar ou recusar os elogios enviados.
            </div>
          </Link>
          <Link
            to="/painel/saques"
            className="rounded-2xl border border-line bg-noir-900 p-6 transition hover:border-gold-500/50"
          >
            <div className="text-2xl">💸</div>
            <div className="mt-2 font-display text-lg">Saques</div>
            <div className="mt-1 text-xs text-muted">
              Processar as solicitações de saque das modelos.
            </div>
          </Link>
        </div>
      </div>
    )
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>

  if (isCliente) {
    return (
      <div className="rounded-2xl border border-line bg-noir-900 p-10 text-center">
        <h1 className="font-display text-2xl">Bem-vindo ao Studio Diamond!</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Aqui você acompanha as modelos que assina e descobre novas com o mesmo
          estilo. Explore os perfis e assine para liberar o conteúdo exclusivo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/painel/assinaturas"
            className="inline-block rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Minhas assinaturas
          </Link>
          <Link
            to="/acompanhantes"
            className="inline-block rounded-xl border border-gold-500/40 px-6 py-3 font-semibold text-gold-400 transition hover:bg-gold-500/10"
          >
            Explorar acompanhantes
          </Link>
        </div>
      </div>
    )
  }

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
  const plano = planoPorSlug(perfil.plano)

  return (
    <div>
      <h1 className="font-display text-3xl">Olá, {perfil.nome_exibicao}</h1>
      <div className={`mt-2 text-sm font-semibold ${st.cor}`}>{st.txt}</div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-noir-900 px-5 py-3 text-sm">
        <span className="text-muted">Plano de vitrine:</span>
        {plano ? (
          <span className="font-display text-gold-300">{plano.nome}</span>
        ) : (
          <span className="text-muted">Nenhum ativo</span>
        )}
        <Link to="/painel/plano" className="ml-auto text-gold-400 underline">
          {plano ? 'Trocar plano' : 'Contratar um plano →'}
        </Link>
      </div>
      {perfil.status === 'pending' && (
        <p className="mt-1 text-xs text-muted">
          A moderação confere seu documento e aprova o anúncio. Você será
          notificada por e-mail.
        </p>
      )}
      <div className="mt-1 text-xs">
        {perfil.verificado ? (
          <span className="text-emerald-400">✓ Conta verificada</span>
        ) : perfil.termos_aceitos_em ? (
          <span className="text-muted">Verificação em análise pela moderação.</span>
        ) : (
          <span className="text-yellow-400">
            Pendente: envie documento e vídeo e aceite os termos em{' '}
            <Link to="/painel/perfil" className="underline">
              Meu perfil
            </Link>
            .
          </span>
        )}
      </div>

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
