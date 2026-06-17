import { useEffect, useState } from 'react'

const KEY = 'studio_age_ok'

/** Modal 18+ simples, exibido ao abrir o site.
 *  Usa sessionStorage: reaparece a cada nova sessão (quando o site é reaberto),
 *  mas não fica perguntando a cada recarregamento na mesma sessão. */
export function AgeGate() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(KEY) !== '1')
    } catch {
      setOpen(true)
    }
  }, [])

  function confirmar() {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* segue mesmo sem storage */
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-noir-950/97 p-6 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-gold-500/25 bg-noir-900 p-8 text-center shadow-2xl">
        <img src="/media/logo-mark.png" alt="Studio" className="mx-auto h-14 w-auto" />
        <div className="mt-2 font-display text-xl tracking-[0.18em] text-gold-400">DIAMOND</div>
        <div className="mx-auto my-4 h-px w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        <h1 className="font-display text-2xl text-ink">Conteúdo adulto +18</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Este site contém material destinado exclusivamente a maiores de 18 anos. Ao entrar, você
          confirma que tem 18 anos ou mais e que é legalmente permitido acessar este conteúdo na sua
          localidade.
        </p>
        <button
          onClick={confirmar}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-4 font-semibold text-white transition hover:brightness-110"
        >
          Tenho 18 anos ou mais — entrar
        </button>
        <a
          href="https://www.google.com"
          className="mt-3 block w-full rounded-xl border border-line px-6 py-3 text-sm text-muted transition hover:text-ink"
        >
          Sou menor de 18 anos — sair
        </a>
      </div>
    </div>
  )
}
