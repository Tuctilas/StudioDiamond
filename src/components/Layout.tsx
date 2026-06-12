import { Link } from '@tanstack/react-router'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-noir-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          {/* logo antigo: silhueta + S + STUDIO (dourado transparente) */}
          <img src="/media/logo-mark.png" alt="Studio" className="h-11 w-auto" />
          <span className="font-display text-xl tracking-[0.18em] text-gold-400">DIAMOND</span>
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
            className="rounded-full border border-gold-500/40 px-4 py-1.5 text-gold-400 transition hover:bg-gold-500/10"
          >
            Anunciar
          </Link>
        </nav>
      </div>
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
