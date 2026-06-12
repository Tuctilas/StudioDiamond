import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { ProfileCard } from '#/components/ProfileCard'
import { CIDADES, cidadePorSlug } from '#/lib/cidades'
import { getProfiles } from '#/lib/queries'

export const Route = createFileRoute('/cidade/$cidade')({
  loader: async ({ params }) => {
    const cidade = cidadePorSlug(params.cidade)
    if (!cidade) throw notFound()
    const perfis = await getProfiles({ cidade: cidade.slug })
    return { cidade, perfis }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: 'Cidade — Studio Diamond' }] }
    const { cidade } = loaderData
    const titulo = `Acompanhantes em ${cidade.nome} (${cidade.estado}) — Studio Diamond`
    return {
      meta: [
        { title: titulo },
        { name: 'description', content: cidade.seo },
        { property: 'og:title', content: titulo },
        { property: 'og:description', content: cidade.seo },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Studio Diamond', item: '/' },
              { '@type': 'ListItem', position: 2, name: `Acompanhantes em ${cidade.nome}` },
            ],
          }),
        },
      ],
    }
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl">Cidade não encontrada</h1>
      <Link to="/" className="mt-6 inline-block text-gold-400 underline">
        Voltar ao início
      </Link>
    </div>
  ),
  component: CidadePage,
})

function CidadePage() {
  const { cidade, perfis } = Route.useLoaderData()
  const outras = CIDADES.filter((c) => c.slug !== cidade.slug).slice(0, 10)

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="text-xs text-muted">
        <Link to="/" className="hover:text-ink">Studio Diamond</Link> /{' '}
        <span className="text-gold-400">{cidade.nome}</span>
      </nav>
      <h1 className="mt-3 font-display text-4xl">
        Acompanhantes em <em className="text-gold-400">{cidade.nome}</em>
        <span className="ml-2 text-2xl text-muted">· {cidade.estado}</span>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{cidade.seo}</p>

      {perfis.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {perfis.map((p) => (
            <ProfileCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-line bg-noir-900 p-10 text-center">
          <p className="text-muted">
            Ainda não temos anunciantes em {cidade.nome}.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-full border border-gold-500/40 px-5 py-2 text-sm text-gold-400 transition hover:bg-gold-500/10"
          >
            Seja a primeira a anunciar aqui →
          </Link>
        </div>
      )}

      <section className="mt-16">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
          Outras cidades
        </h2>
        <div className="flex flex-wrap gap-2">
          {outras.map((c) => (
            <Link
              key={c.slug}
              to="/cidade/$cidade"
              params={{ cidade: c.slug }}
              className="rounded-full border border-gold-500/20 px-4 py-1.5 text-sm text-muted transition hover:border-gold-500 hover:text-ink"
            >
              {c.nome}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
