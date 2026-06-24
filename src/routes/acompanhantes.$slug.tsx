import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { ElogiosModelo } from '#/components/ElogiosModelo'
import { EnviarPresente } from '#/components/EnviarPresente'
import { GaleriaItem } from '#/components/GaleriaItem'
import { RankingDoadores } from '#/components/RankingDoadores'
import { VipArea } from '#/components/VipArea'
import { cidadePorSlug } from '#/lib/cidades'
import { PLANO_SELO, planoPorSlug } from '#/lib/planos'
import { getElogiosPublicos, getProfileBySlug } from '#/lib/queries'
import { GRUPOS_CARAC, fmtBRL, waLink } from '#/lib/supabase'

// Ícones (paths SVG, viewBox 0 0 24 24) das redes sociais.
const REDE_PATH = {
  instagram:
    'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.36 2.67.95 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13.66.66 1.33 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.7 5.7 0 0 0 2.13-1.38 5.7 5.7 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.7 5.7 0 0 0-1.38-2.12A5.7 5.7 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z',
  twitter:
    'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  tiktok:
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.08-.14 1.62.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  telegram:
    'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
}

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
    const capa =
      loaderData.fotos.find((f) => f.is_capa && f.tipo !== 'video') ??
      loaderData.fotos.find((f) => f.tipo !== 'video')
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
      <Link to="/" className="mt-6 inline-block text-gold-400 underline">
        Ver todas as acompanhantes
      </Link>
    </div>
  ),
  component: Perfil,
})

function Perfil() {
  const p = Route.useLoaderData()
  const cidade = p.cidade ? cidadePorSlug(p.cidade) : undefined
  const capa =
    p.fotos.find((f) => f.is_capa && f.tipo !== 'video') ??
    p.fotos.find((f) => f.tipo !== 'video')
  const whats = waLink(p.whatsapp ?? p.telefone, p.nome_exibicao)
  const plano = planoPorSlug(p.plano)
  const podeReceberPresente = !!plano && ['ouro', 'diamante', 'ruby'].includes(plano.slug)

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

  const tituloFaixa =
    'mb-2 rounded bg-noir-950/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold-400'

  const redes = (
    [
      { nome: 'Instagram', url: p.rede_instagram, path: REDE_PATH.instagram },
      { nome: 'Twitter / X', url: p.rede_twitter, path: REDE_PATH.twitter },
      { nome: 'TikTok', url: p.rede_tiktok, path: REDE_PATH.tiktok },
      { nome: 'Telegram', url: p.rede_telegram, path: REDE_PATH.telegram },
    ] as Array<{ nome: string; url: string | null; path: string }>
  ).filter((r): r is { nome: string; url: string; path: string } => !!r.url)
  const hrefRede = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link to="/" className="text-sm text-muted transition hover:text-ink">
        ← Voltar
      </Link>

      {/* Mobile: capa → info → selecionáveis (ordem do DOM).
          Desktop: capa (col1/linha1) · info+elogios (col2, ocupa as 2 linhas) · selecionáveis (col1/linha2). */}
      <div className="mt-4 grid items-start gap-8 md:grid-cols-[340px_1fr] md:grid-rows-[auto_1fr]">
        {/* CAPA — vídeo (se houver) ou foto */}
        <div className="overflow-hidden rounded-2xl border border-gold-500/15 bg-noir-800 md:col-start-1 md:row-start-1">
          {p.capa_video_url ? (
            <video
              src={p.capa_video_url}
              controls
              autoPlay
              muted
              loop
              playsInline
              controlsList="nodownload"
              className="aspect-[3/4] w-full object-cover"
            />
          ) : capa ? (
            <img
              src={capa.url}
              alt={p.nome_exibicao}
              style={{ objectPosition: `${capa.foco_x}% ${capa.foco_y}%` }}
              className="aspect-[3/4] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center text-xs uppercase tracking-widest text-muted">
              [ foto ]
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: info + fotos + área restrita + elogios */}
        <div className="md:col-start-2 md:row-start-1 md:row-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-gold-300 sm:text-4xl">{p.nome_exibicao}</h1>
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
                  {fmtBRL(p.preco_hora)} <span className="text-sm font-normal text-ink/60">/ 1h</span>
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

          {(whats || podeReceberPresente) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {whats && (
                <a
                  href={whats}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-7 py-4 font-semibold text-white transition hover:brightness-110"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02zM12.04 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.69 8.23-8.23 8.23z" />
                  </svg>
                  Falar no WhatsApp
                </a>
              )}
              {podeReceberPresente && (
                <a
                  href="#enviar-presente"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-7 py-4 font-semibold text-white transition hover:brightness-110"
                >
                  🎁 Enviar presente
                </a>
              )}
            </div>
          )}

          {/* CARACTERÍSTICAS — cada uma num bloco que se ajusta (sem fundo vazio) */}
          {specs.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {specs.map(([k, v], i) => (
                <div key={i} className="rounded-xl border border-line bg-noir-800 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                  <div className="font-display text-base">{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* FOTOS E VÍDEOS PÚBLICOS (demais mídias) */}
          {p.fotos.filter((f) => f.id !== capa?.id).length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-display text-xl">Fotos e vídeos</h2>
              <div className="grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3">
                {p.fotos
                  .filter((f) => f.id !== capa?.id)
                  .map((f) => (
                    <GaleriaItem
                      key={f.id}
                      src={f.url}
                      tipo={f.tipo}
                      grande={f.tamanho === 'grande'}
                      foco={{ x: f.foco_x, y: f.foco_y }}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* PRESENTES + RANKING DE DOADORES */}
          {podeReceberPresente && (
            <>
              <div id="enviar-presente" className="scroll-mt-6">
                <EnviarPresente profileId={p.id} nome={p.nome_exibicao} donoUserId={p.user_id} />
              </div>
              <RankingDoadores profileId={p.id} />
            </>
          )}

          {/* ÁREA RESTRITA (VIP) — abaixo das fotos */}
          <VipArea
            profileId={p.id}
            nome={p.nome_exibicao}
            vipAtivo={p.vip_ativo}
            vipPreco={p.vip_preco}
            donoUserId={p.user_id}
          />

          {/* ELOGIOS DESTA MODELO — abaixo da área de membros */}
          <ElogiosModelo profileId={p.id} nome={p.nome_exibicao} iniciais={p.elogios} />
        </div>

        {/* SELECIONÁVEIS: fetiches + características + observações
            (no desktop fica sob a foto; no mobile vem por último) */}
        {(p.fetiches.length > 0 ||
          p.caracteristicas.length > 0 ||
          p.observacoes ||
          redes.length > 0) && (
          <div className="space-y-5 rounded-2xl border border-line bg-noir-900/60 p-5 md:col-start-1 md:row-start-2">
            {p.fetiches.length > 0 && (
              <div>
                <div className={tituloFaixa}>Fetiches</div>
                <div className="flex flex-wrap gap-2">
                  {p.fetiches.map((f) => (
                    <Link
                      key={f.id}
                      to="/"
                      search={{ fetiche: [f.slug] }}
                      className="rounded-full border border-gold-500/40 bg-black px-3 py-1 text-sm text-gold-300 transition hover:bg-gold-500/10"
                    >
                      {f.nome}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {GRUPOS_CARAC.map(({ grupo, titulo }) => {
              const itens = p.caracteristicas.filter((c) => c.grupo === grupo)
              if (!itens.length) return null
              return (
                <div key={grupo}>
                  <div className={tituloFaixa}>{titulo}</div>
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

            {p.observacoes && (
              <div>
                <div className={tituloFaixa}>Observações</div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {p.observacoes}
                </p>
              </div>
            )}

            {redes.length > 0 && (
              <div>
                <div className={tituloFaixa}>Redes sociais</div>
                <div className="flex flex-wrap gap-2">
                  {redes.map((r) => (
                    <a
                      key={r.nome}
                      href={hrefRede(r.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={r.nome}
                      aria-label={r.nome}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 text-gold-300 transition hover:bg-gold-500/10"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d={r.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
