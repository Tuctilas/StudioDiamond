import { Link, createFileRoute } from '@tanstack/react-router'

import { ProfileCard } from '#/components/ProfileCard'
import { CIDADES } from '#/lib/cidades'
import { getDestaques } from '#/lib/queries'

export const Route = createFileRoute('/')({
  loader: () => getDestaques(),
  head: () => ({
    meta: [
      { title: 'Studio Diamond — Acompanhantes de Luxo no Brasil' },
      {
        name: 'description',
        content:
          'As acompanhantes mais desejadas do Brasil em um só lugar. Perfis verificados, fotos reais e contato direto pelo WhatsApp. Escolha sua cidade.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  const destaques = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* HERO */}
      <section className="py-14 text-center sm:py-20">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">
          Acompanhantes de luxo
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          As melhores acompanhantes{' '}
          <em className="text-gold-400">do Brasil</em>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Perfis verificados, com discrição e elegância. Veja fotos, detalhes e
          fale direto pelo WhatsApp.
        </p>
        <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-3 text-xs text-muted">
          <span>✓ Perfis verificados</span>
          <span>✓ Contato direto e discreto</span>
          <span>✓ +18 · dentro da lei</span>
        </div>
      </section>

      {/* BUSCA POR CIDADE */}
      <section aria-label="Escolha a cidade">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
          Escolha a cidade
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-3">
          {CIDADES.map((c) => (
            <Link
              key={c.slug}
              to="/cidade/$cidade"
              params={{ cidade: c.slug }}
              className="flex-none rounded-full border border-gold-500/20 bg-noir-800/40 px-4 py-2 text-sm text-muted transition hover:border-gold-500 hover:text-ink"
            >
              {c.nome} · {c.estado}
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-3xl">Destaques</h2>
          <Link
            to="/acompanhantes"
            className="text-sm text-gold-400 transition hover:text-gold-300"
          >
            Ver todas →
          </Link>
        </div>
        {destaques.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destaques.map((p) => (
              <ProfileCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-sm text-muted">
            Em breve, perfis em destaque na sua cidade.
          </p>
        )}
      </section>

      {/* SEO institucional */}
      <section className="mt-16 max-w-3xl text-sm leading-relaxed text-muted">
        <h2 className="font-display text-2xl text-ink">
          Acompanhantes verificadas em todas as capitais
        </h2>
        <p className="mt-3">
          O Studio Diamond reúne anunciantes independentes e verificadas nas principais
          capitais do Brasil. Cada perfil tem fotos reais, características,
          valores e contato direto pelo WhatsApp — sem intermediários. Todas as
          anunciantes confirmam ser maiores de 18 anos e podem remover o
          anúncio a qualquer momento.
        </p>
      </section>
    </div>
  )
}
