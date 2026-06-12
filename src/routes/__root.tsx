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
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
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
