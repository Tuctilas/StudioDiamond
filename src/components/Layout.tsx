import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-noir-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
          <img src="/logo-v11.png" alt="Studio Diamond" className="h-14 w-auto sm:h-16" />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            to="/acompanhantes"
            className="hidden text-muted transition hover:text-ink sm:block"
          >
            Acompanhantes
          </Link>
          <Link
            to="/auth"
            className="hidden text-muted transition hover:text-ink sm:block"
          >
            Entrar
          </Link>
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
          <Link
            to="/acompanhantes"
            onClick={() => setOpen(false)}
            className="block py-2 text-muted transition hover:text-ink"
          >
            Acompanhantes
          </Link>
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="block py-2 text-muted transition hover:text-ink"
          >
            Entrar
          </Link>
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
