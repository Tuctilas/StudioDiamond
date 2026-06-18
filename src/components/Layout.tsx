import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Menu, User, X } from 'lucide-react'

import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export function Header() {
  const [open, setOpen] = useState(false)
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')

  // Nome a exibir: nome de exibição da modelo, senão o início do e-mail.
  useEffect(() => {
    if (!user) {
      setNome('')
      return
    }
    let cancel = false
    setNome(user.email?.split('@')[0] ?? 'Minha conta')
    supabase
      .from('profiles')
      .select('nome_exibicao')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancel && data?.nome_exibicao) setNome(data.nome_exibicao)
      })
    return () => {
      cancel = true
    }
  }, [user])

  async function sair() {
    setOpen(false)
    await supabase.auth.signOut()
    navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-noir-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
          <img src="/logo-v11.png" alt="Studio Diamond" className="h-14 w-auto sm:h-16" />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {session ? (
            <>
              <Link
                to="/painel"
                className="hidden items-center gap-1.5 text-ink transition hover:text-gold-300 sm:flex"
              >
                <User className="h-4 w-4 text-gold-400" />
                <span className="max-w-[140px] truncate">{nome || 'Minha conta'}</span>
              </Link>
              <button
                onClick={sair}
                className="hidden text-muted transition hover:text-ink sm:block"
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/auth" className="hidden text-muted transition hover:text-ink sm:block">
              Entrar
            </Link>
          )}
          <Link
            to="/anuncie"
            className="rounded-full border border-gold-500/40 px-4 py-1.5 text-gold-400 transition hover:bg-gold-500/10"
          >
            Anunciar
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            className="text-muted transition hover:text-ink sm:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </div>

      {open && (
        <nav className="border-t border-line bg-noir-950/95 px-5 py-3 text-sm sm:hidden">
          {session ? (
            <>
              <Link
                to="/painel"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 py-2 text-ink transition hover:text-gold-300"
              >
                <User className="h-4 w-4 text-gold-400" />
                {nome || 'Minha conta'}
              </Link>
              <button
                onClick={sair}
                className="block w-full py-2 text-left text-muted transition hover:text-ink"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="block py-2 text-muted transition hover:text-ink"
            >
              Entrar
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line py-10 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          © {new Date().getFullYear()} Studio Diamond · Anúncios +18 · Todas
          as anunciantes são maiores de 18 anos, com idade verificada.
        </div>
        <div className="flex gap-4">
          <Link to="/termos" className="transition hover:text-ink">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="transition hover:text-ink">
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
