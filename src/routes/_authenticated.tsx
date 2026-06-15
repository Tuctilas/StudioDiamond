import { Link, Navigate, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: AuthGate,
})

function AuthGate() {
  const { loading, session, isAdmin, isCliente } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Carregando…
      </div>
    )
  }
  if (!session) return <Navigate to="/auth" />

  async function sair() {
    await supabase.auth.signOut()
    navigate({ to: '/' })
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            to="/painel"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'border-gold-500 text-gold-300' }}
            className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
          >
            Painel
          </Link>
          {isAdmin ? (
            <>
              <Link
                to="/painel/admin"
                activeProps={{ className: 'border-gold-500 text-gold-300' }}
                className="rounded-full border border-gold-500/40 px-4 py-1.5 text-gold-400 transition hover:bg-gold-500/10"
              >
                Moderação
              </Link>
              <Link
                to="/painel/elogios"
                activeProps={{ className: 'border-gold-500 text-gold-300' }}
                className="rounded-full border border-gold-500/40 px-4 py-1.5 text-gold-400 transition hover:bg-gold-500/10"
              >
                Elogios
              </Link>
              <Link
                to="/painel/saques"
                activeProps={{ className: 'border-gold-500 text-gold-300' }}
                className="rounded-full border border-gold-500/40 px-4 py-1.5 text-gold-400 transition hover:bg-gold-500/10"
              >
                Saques
              </Link>
            </>
          ) : (
            <>
              {!isCliente && (
                <>
                  <Link
                    to="/painel/perfil"
                    activeProps={{ className: 'border-gold-500 text-gold-300' }}
                    className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
                  >
                    Meu perfil
                  </Link>
                  <Link
                    to="/painel/fotos"
                    activeProps={{ className: 'border-gold-500 text-gold-300' }}
                    className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
                  >
                    Fotos
                  </Link>
                  <Link
                    to="/painel/vip"
                    activeProps={{ className: 'border-gold-500 text-gold-300' }}
                    className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
                  >
                    Conteúdo VIP
                  </Link>
                  <Link
                    to="/painel/carteira"
                    activeProps={{ className: 'border-gold-500 text-gold-300' }}
                    className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
                  >
                    Carteira
                  </Link>
                  <Link
                    to="/painel/plano"
                    activeProps={{ className: 'border-gold-500 text-gold-300' }}
                    className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
                  >
                    Plano
                  </Link>
                </>
              )}
              <Link
                to="/painel/assinaturas"
                activeProps={{ className: 'border-gold-500 text-gold-300' }}
                className="rounded-full border border-line px-4 py-1.5 text-muted transition hover:text-ink"
              >
                Minhas assinaturas
              </Link>
            </>
          )}
        </nav>
        <button onClick={sair} className="text-xs text-muted underline hover:text-ink">
          sair
        </button>
      </div>
      <Outlet />
    </div>
  )
}
