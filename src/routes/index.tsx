import { Link, createFileRoute } from '@tanstack/react-router'

import { ProfileCard } from '#/components/ProfileCard'
import { CIDADES } from '#/lib/cidades'
import { getCategories, getFetiches, getProfiles } from '#/lib/queries'

interface BuscaParams {
  cidade?: string[]
  categoria?: string[]
  fetiche?: string[]
  idade?: number
  preco?: string
}

const IDADES = [
  { v: 25, nome: 'Até 25 anos' },
  { v: 35, nome: 'Até 35 anos' },
  { v: 45, nome: 'Até 45 anos' },
]
const PRECOS: Array<{ key: string; nome: string; min?: number; max?: number }> = [
  { key: 'ate-300', nome: 'Até R$ 300', max: 300 },
  { key: 'ate-500', nome: 'Até R$ 500', max: 500 },
  { key: 'ate-1000', nome: 'Até R$ 1.000', max: 1000 },
  { key: 'acima-2500', nome: 'Acima de R$ 2.500', min: 2500 },
  { key: 'acima-4000', nome: 'Acima de R$ 4.000', min: 4000 },
]

/** Aceita ?cidade=a&cidade=b ou ?cidade=a e devolve sempre um array (ou undefined). */
function arr(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const out = v.filter((x): x is string => typeof x === 'string' && x.length > 0)
    return out.length ? out : undefined
  }
  if (typeof v === 'string' && v) return [v]
  return undefined
}

export const Route = createFileRoute('/')({
  validateSearch: (s: Record<string, unknown>): BuscaParams => ({
    cidade: arr(s.cidade),
    categoria: arr(s.categoria),
    fetiche: arr(s.fetiche),
    idade: s.idade ? Number(s.idade) : undefined,
    preco: typeof s.preco === 'string' ? s.preco : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const faixa = PRECOS.find((p) => p.key === deps.preco)
    const [perfis, categorias, fetiches] = await Promise.all([
      getProfiles({
        cidade: deps.cidade,
        categoria: deps.categoria,
        fetiche: deps.fetiche,
        idadeMax: deps.idade,
        precoMin: faixa?.min,
        precoMax: faixa?.max,
      }),
      getCategories(),
      getFetiches(),
    ])
    return { perfis, categorias, fetiches }
  },
  head: () => ({
    meta: [
      { title: 'Studio Diamond — Acompanhantes de Luxo no Brasil' },
      {
        name: 'description',
        content:
          'As acompanhantes mais desejadas do Brasil em um só lugar. Perfis verificados, fotos reais e contato direto pelo WhatsApp. Filtre por cidade, categoria e valor.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  const { perfis, categorias, fetiches } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function setFiltro(patch: Partial<BuscaParams>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  }

  function toggleMulti(key: 'cidade' | 'categoria' | 'fetiche', value: string) {
    const cur = search[key] ?? []
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]
    setFiltro({ [key]: next.length ? next : undefined })
  }

  function resumoMulti(sel: string[] | undefined, nomeDe: (slug: string) => string | undefined) {
    if (!sel?.length) return undefined
    return sel.length === 1 ? nomeDe(sel[0]) : `${sel.length} selecionados`
  }

  const categoriaNome = (slug: string) => categorias.find((c) => c.slug === slug)?.nome
  const feticheNome = (slug: string) => fetiches.find((f) => f.slug === slug)?.nome

  const ativos =
    (search.cidade?.length ?? 0) +
    (search.categoria?.length ?? 0) +
    (search.fetiche?.length ?? 0) +
    (search.idade ? 1 : 0) +
    (search.preco ? 1 : 0)

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      {/* HERO compacto */}
      <section className="text-center">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          As melhores acompanhantes <em className="text-gold-400">do Brasil</em>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Perfis verificados, com discrição e elegância. Escolha a cidade e filtre ao lado.
        </p>
      </section>

      {/* CIDADE — filtro principal no topo */}
      <section aria-label="Escolha a cidade" className="mt-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
          Escolha a cidade
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CIDADES.map((c) => {
            const on = search.cidade?.includes(c.slug) ?? false
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleMulti('cidade', c.slug)}
                className={`flex-none rounded-full border px-4 py-2 text-sm transition ${
                  on
                    ? 'border-gold-500 bg-black text-gold-300'
                    : 'border-gold-500/20 bg-noir-800/40 text-muted hover:border-gold-500 hover:text-ink'
                }`}
              >
                {c.nome} · {c.estado}
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* SIDEBAR DE FILTROS (sem cidade — ela fica no topo) */}
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Filtros{ativos ? ` · ${ativos}` : ''}
            </span>
            {ativos > 0 && (
              <Link to="/" search={{}} className="text-xs text-gold-400 underline">
                Limpar
              </Link>
            )}
          </div>

          <Bloco titulo="Categoria" resumo={resumoMulti(search.categoria, categoriaNome)}>
            <Pills>
              {categorias.map((c) => (
                <Pill
                  key={c.slug}
                  on={search.categoria?.includes(c.slug) ?? false}
                  onClick={() => toggleMulti('categoria', c.slug)}
                >
                  {c.nome}
                </Pill>
              ))}
            </Pills>
          </Bloco>

          <Bloco
            titulo="Fetiche"
            resumo={resumoMulti(search.fetiche, feticheNome)}
            aberto={Boolean(search.fetiche?.length)}
          >
            <Pills scroll>
              {fetiches.map((f) => (
                <Pill
                  key={f.slug}
                  on={search.fetiche?.includes(f.slug) ?? false}
                  onClick={() => toggleMulti('fetiche', f.slug)}
                >
                  {f.nome}
                </Pill>
              ))}
            </Pills>
          </Bloco>

          <Bloco titulo="Idade" resumo={search.idade ? `Até ${search.idade}` : undefined}>
            <Pills>
              {IDADES.map((i) => (
                <Pill
                  key={i.v}
                  on={search.idade === i.v}
                  onClick={() => setFiltro({ idade: search.idade === i.v ? undefined : i.v })}
                >
                  {i.nome}
                </Pill>
              ))}
            </Pills>
          </Bloco>

          <Bloco titulo="Valor" resumo={PRECOS.find((p) => p.key === search.preco)?.nome}>
            <Pills>
              {PRECOS.map((p) => (
                <Pill
                  key={p.key}
                  on={search.preco === p.key}
                  onClick={() => setFiltro({ preco: search.preco === p.key ? undefined : p.key })}
                >
                  {p.nome}
                </Pill>
              ))}
            </Pills>
          </Bloco>
        </aside>

        {/* GRADE */}
        <div>
          {perfis.length ? (
            <>
              <div className="mb-4 text-sm text-muted">
                {perfis.length} {perfis.length === 1 ? 'perfil' : 'perfis'}
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {perfis.map((p) => (
                  <ProfileCard key={p.id} p={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-line py-16 text-center text-sm text-muted">
              Nenhum perfil encontrado com esses filtros.{' '}
              <Link to="/" search={{}} className="text-gold-400 underline">
                Limpar filtros
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SEO institucional */}
      <section className="mx-auto mt-16 max-w-3xl text-center text-sm leading-relaxed text-muted">
        <h2 className="font-display text-2xl text-ink">
          Acompanhantes verificadas em todas as capitais
        </h2>
        <p className="mt-3">
          O Studio Diamond reúne anunciantes independentes e verificadas nas principais capitais do
          Brasil. Cada perfil tem fotos reais, características, valores e contato direto pelo
          WhatsApp — sem intermediários. Todas as anunciantes confirmam ser maiores de 18 anos e
          podem remover o anúncio a qualquer momento.
        </p>
      </section>
    </div>
  )
}

/** Bloco de filtro recolhível (accordion). */
function Bloco({
  titulo,
  resumo,
  aberto = true,
  children,
}: {
  titulo: string
  resumo?: string
  aberto?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={aberto} className="group rounded-xl border border-line bg-noir-800/60">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
        <span>{titulo}</span>
        <span className="flex items-center gap-2">
          {resumo && (
            <span className="max-w-[110px] truncate text-xs font-normal text-gold-400">{resumo}</span>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 text-muted transition group-open:rotate-180"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}

function Pills({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${scroll ? 'max-h-52 overflow-y-auto pr-1' : ''}`}>
      {children}
    </div>
  )
}

function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        on ? 'border-gold-500/60 bg-black text-gold-300' : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
