import { useEffect } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import { AgeGate } from '#/components/AgeGate'
import { Ambient } from '#/components/Ambient'
import { Footer, Header } from '#/components/Layout'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Studio Diamond — Acompanhantes de Luxo no Brasil' },
      {
        name: 'description',
        content:
          'Studio Diamond — as acompanhantes mais desejadas do Brasil. Perfis verificados, fotos reais e contato direto e discreto pelo WhatsApp. Anúncios para maiores de 18.',
      },
      { name: 'rating', content: 'adult' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
    // Google Analytics (gtag.js) — `scripts` no head() é renderizado no <head>.
    scripts: [
      { src: 'https://www.googletagmanager.com/gtag/js?id=G-6W9MPM6W7Z', async: true },
      {
        children:
          "window.dataLayer = window.dataLayer || [];" +
          'function gtag(){dataLayer.push(arguments);}' +
          "gtag('js', new Date());" +
          "gtag('config', 'G-6W9MPM6W7Z');",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  // Dificulta o download das mídias: bloqueia botão direito e arrastar em img/vídeo.
  useEffect(() => {
    const isMedia = (t: EventTarget | null) =>
      t instanceof Element && (t.tagName === 'IMG' || t.tagName === 'VIDEO')
    const onContext = (e: MouseEvent) => {
      if (isMedia(e.target)) e.preventDefault()
    }
    const onDrag = (e: DragEvent) => {
      if (isMedia(e.target)) e.preventDefault()
    }
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('dragstart', onDrag)
    return () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('dragstart', onDrag)
    }
  }, [])

  return (
    <>
      <Ambient />
      <AgeGate />
      <Header />
      <main className="min-h-[70vh]">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
