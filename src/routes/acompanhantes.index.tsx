import { Link, createFileRoute } from '@tanstack/react-router'

import { ProfileCard } from '#/components/ProfileCard'
import { CIDADES } from '#/lib/cidades'
import { getCategories, getProfiles } from '#/lib/queries'

interface BuscaParams {
  cidade?: string
  categoria?: string
  idade?: number
  preco?: number
}

export const Route = createFileRoute('/acompanhantes/')({
  validateSearch: (s: Record<string, unknown>): BuscaParams => ({
    cidade: typeof s.cidade === 'string' ? s.cidade : undefined,
    categoria: typeof s.categoria === 'string' ? s.categoria : undefined,
    idade: s.idade ? Number(s.idade) : undefined,
    preco: s.preco ? Number(s.preco) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [perfis, categorias] = await Promise.all([
      getProfiles({
        cidade: deps.cidade,
        categoria: deps.categoria,
        idadeMax: deps.idade,
        precoMax: deps.preco,
      }),
      getCategories(),
    ])
    return { perfis, categorias }
  },
  head: () => ({
    meta: [
      { title: 'Acompanhantes — Studio Diamond' },
      {
        name: 'description',
        content:
          'Listagem completa de acompanhantes verificadas. Filtre por cidade, categoria, idade e valor.',
      },
    ],
  }),
  component: Listagem,
})

function Listagem() {
  const { perfis, categorias } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function setFiltro(patch: Partial<BuscaParams>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-4xl">Acompanhantes</h1>
      <p className="mt-2 text-sm text-muted">
        Filtre por cidade, categoria, idade ou valor. Toque em um perfil para
        ver fotos, detalhes e WhatsApp.
      </p>

      {/* FILTROS */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select
          value={search.cidade ?? ''}
          onChange={(e) => setFiltro({ cidade: e.target.value || undefined })}
          className="rounded-xl border border-line bg-noir-800 px-3 py-2.5 text-sm"
        >
          <option value="">Todas as cidades</option>
          {CIDADES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nome} · {c.estado}
            </option>
          ))}
        </select>
        <select
          value={search.categoria ?? ''}
          onChange={(e) => setFiltro({ categoria: e.target.value || undefined })}
          className="rounded-xl border border-line bg-noir-800 px-3 py-2.5 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          value={search.idade ?? ''}
          onChange={(e) => setFiltro({ idade: e.target.value ? Number(e.target.value) : undefined })}
          className="rounded-xl border border-line bg-noir-800 px-3 py-2.5 text-sm"
        >
          <option value="">Qualquer idade</option>
          <option value="25">Até 25 anos</option>
          <option value="35">Até 35 anos</option>
          <option value="45">Até 45 anos</option>
        </select>
        <select
          value={search.preco ?? ''}
          onChange={(e) => setFiltro({ preco: e.target.value ? Number(e.target.value) : undefined })}
          className="rounded-xl border border-line bg-noir-800 px-3 py-2.5 text-sm"
        >
          <option value="">Qualquer valor</option>
          <option value="300">Até R$ 300</option>
          <option value="500">Até R$ 500</option>
          <option value="1000">Até R$ 1.000</option>
        </select>
      </div>

      {/* GRADE */}
      {perfis.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {perfis.map((p) => (
            <ProfileCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-muted">
          Nenhum perfil encontrado com esses filtros.{' '}
          <Link to="/acompanhantes" className="text-gold-400 underline">
            Limpar filtros
          </Link>
        </div>
      )}
    </div>
  )
}
