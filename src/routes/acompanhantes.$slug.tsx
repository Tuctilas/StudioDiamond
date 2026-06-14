import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { ElogiosModelo } from '#/components/ElogiosModelo'
import { VipArea } from '#/components/VipArea'
import { cidadePorSlug } from '#/lib/cidades'
import { PLANO_SELO, planoPorSlug } from '#/lib/planos'
import { getElogiosPublicos, getProfileBySlug } from '#/lib/queries'
import { GRUPOS_CARAC, fmtBRL, waLink } from '#/lib/supabase'

export const Route = createFileRoute('/acompanhantes/$slug')({
  loader: async ({ params }) => {
    const perfil = await getProfileBySlug(params.slug)
    if (!perfil) throw notFound()
    const elogios = await getElogiosPublicos(perfil.id)
    return { ...perfil, elogios }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: 'Perfil — Studio Diamond' }] }
    const cidade = loaderData.cidade ? cidadePorSlug(loaderData.cidade) : undefined
    const titulo = `${loaderData.nome_exibicao}${cidade ? ` — Acompanhante em ${cidade.nome}` : ''} | Studio Diamond`
    const desc =
      loaderData.bio?.slice(0, 150) ??
      `Perfil verificado de ${loaderData.nome_exibicao} no Studio Diamond. Fotos reais e contato direto pelo WhatsApp.`
    const capa = loaderData.fotos.find((f) => f.is_capa) ?? loaderData.fotos[0]
    return {
      meta: [
        { title: titulo },
        { name: 'description', content: desc },
        { property: 'og:title', content: titulo },
        { property: 'og:description', content: desc },
        { property: 'og:type', content: 'profile' },
        ...(capa ? [{ property: 'og:image', content: capa.url }] : []),
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: loaderData.nome_exibicao,
            ...(cidade
              ? { address: { '@type': 'PostalAddress', addressLocality: cidade.nome, addressRegion: cidade.estado } }
              : {}),
            ...(capa ? { image: capa.url } : {}),
          }),
        },
      ],
    }
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl">Perfil não encontrado</h1>
      <p className="mt-3 text-muted">Este anúncio não existe ou foi pausado.</p>
      <Link to="/acompanhantes" className="mt-6 inline-block text-gold-400 underline">
        Ver todas as acompanhantes
      </Link>
    </div>
  ),
  component: Perfil,
})

function Perfil() {
  const p = Route.useLoaderData()
  const cidade = p.cidade ? cidadePorSlug(p.cidade) : undefined
  const capa = p.fotos.find((f) => f.is_capa) ?? p.fotos[0]
  const whats = waLink(p.whatsapp ?? p.telefone, p.nome_exibicao)
  const plano = planoPorSlug(p.plano)

  const specs: Array<[string, string]> = []
  if (p.idade) specs.push(['Idade', `${p.idade} anos`])
  if (p.altura) specs.push(['Altura', p.altura])
  if (p.peso) specs.push(['Peso', p.peso])
  if (p.manequim) specs.push(['Manequim', p.manequim])
  if (p.biotipo) specs.push(['Biotipo', p.biotipo])
  if (p.cabelo) specs.push(['Cabelos', p.cabelo])
  if (p.olhos) specs.push(['Olhos', p.olhos])
  if (p.seios) specs.push(['Seios', p.seios])
  if (p.cintura) specs.push(['Cintura', p.cintura])
  if (p.quadril) specs.push(['Quadril', p.quadril])
  if (p.pes) specs.push(['Pés', p.pes])
  if (p.tatuagem) specs.push(['Tatuagem', p.tatuagem])
  if (p.piercing) specs.push(['Piercing', p.piercing])
  if (p.fumante) specs.push(['Fumante', p.fumante])
  if (p.nivel_cultural) specs.push(['Nível cultural', p.nivel_cultural])
  if (p.signo) specs.push(['Signo', p.signo])
  if (cidade) specs.push(['Cidade', `${cidade.nome} · ${cidade.estado}`])
  if (p.bairro) specs.push(['Bairro', p.bairro])
  for (const c of p.categorias) specs.push(['Categoria', c.nome])

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link to="/acompanhantes" className="text-sm text-muted transition hover:text-ink">
        ← Voltar
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[340px_1fr]">
        {/* CAPA */}
        <div className="overflow-hidden rounded-2xl border border-gold-500/15 bg-noir-800">
          {capa ? (
            <img src={capa.url} alt={p.nome_exibicao} className="aspect-[3/4] w-full object-cover" />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center text-xs uppercase tracking-widest text-muted">
              [ foto ]
            </div>
          )}
        </div>

        {/* INFO */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl text-gold-300">{p.nome_exibicao}</h1>
            {plano && (
              <span
                className={`rounded-full bg-gradient-to-r px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${PLANO_SELO[plano.slug]}`}
              >
                {plano.nome}
              </span>
            )}
          </div>
          {cidade && (
            <div className="mt-1 text-sm text-muted">
              📍 {cidade.nome} · {cidade.estado}
              {p.bairro ? ` — ${p.bairro}` : ''}
            </div>
          )}
          {(p.preco_hora != null || p.preco_2h != null || p.preco_pernoite) && (
            <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-1">
              {p.preco_hora != null && (
                <div className="font-display text-2xl font-semibold text-gold-300">
                  {fmtBRL(p.preco_hora)}{' '}
                  <span className="text-sm font-normal text-ink/60">/ 1h</span>
                </div>
              )}
              {p.preco_2h != null && (
                <div className="font-display text-xl text-ink">
                  {fmtBRL(p.preco_2h)} <span className="text-sm text-ink/60">/ 2h</span>
                </div>
              )}
              {p.preco_pernoite && (
                <div className="text-sm text-ink/80">
                  Pernoite: <span className="font-semibold">{p.preco_pernoite}</span>
                </div>
              )}
            </div>
          )}
          {p.bio && <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-muted">{p.bio}</p>}

          {whats && (
            <a
              href={whats}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-7 py-4 font-semibold text-white transition hover:brightness-110"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02zM12.04 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.69 8.23-8.23 8.23z" />
              </svg>
              Falar no WhatsApp
            </a>
          )}

          {/* CARACTERÍSTICAS */}
          {specs.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              {specs.map(([k, v], i) => (
                <div key={i} className="bg-noir-800 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                  <div className="font-display text-base">{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* FETICHES */}
          {p.fetiches.length > 0 && (
            <div className="mt-8">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">Fetiches</div>
              <div className="flex flex-wrap gap-2">
                {p.fetiches.map((f) => (
                  <Link
                    key={f.id}
                    to="/acompanhantes"
                    search={{ fetiche: [f.slug] }}
                    className="rounded-full border border-gold-500/40 bg-black px-3 py-1 text-sm text-gold-300 transition hover:bg-gold-500/10"
                  >
                    {f.nome}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* GRUPOS DE CARACTERÍSTICAS */}
          {GRUPOS_CARAC.map(({ grupo, titulo }) => {
            const itens = p.caracteristicas.filter((c) => c.grupo === grupo)
            if (!itens.length) return null
            return (
              <div key={grupo} className="mt-8">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">{titulo}</div>
                <div className="flex flex-wrap gap-2">
                  {itens.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full border border-line bg-noir-800 px-3 py-1 text-sm text-ink"
                    >
                      {c.nome}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}

          {/* OBSERVAÇÕES */}
          {p.observacoes && (
            <div className="mt-8">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">
                Observações
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                {p.observacoes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA VIP (restrita) — acima das fotos públicas */}
      <VipArea
        profileId={p.id}
        nome={p.nome_exibicao}
        vipAtivo={p.vip_ativo}
        vipPreco={p.vip_preco}
        donoUserId={p.user_id}
      />

      {/* GALERIA */}
      {p.fotos.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl">Fotos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.fotos.map((f) => (
              <img
                key={f.id}
                src={f.url}
                alt={p.nome_exibicao}
                loading="lazy"
                className="aspect-[3/4] w-full rounded-xl border border-line object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {/* ELOGIOS DESTA MODELO */}
      <ElogiosModelo profileId={p.id} nome={p.nome_exibicao} iniciais={p.elogios} />
    </div>
  )
}
