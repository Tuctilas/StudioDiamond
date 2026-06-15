import { Link, createFileRoute } from '@tanstack/react-router'

import { PLANOS, PLANO_SELO, PROMO, precoComPromo } from '#/lib/planos'
import { getTotalCadastros } from '#/lib/queries'
import { fmtBRL } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/anuncie')({
  loader: async () => {
    const total = await getTotalCadastros()
    return { total }
  },
  head: () => ({
    meta: [
      { title: 'Anuncie no Studio Diamond — Planos de Vitrine' },
      {
        name: 'description',
        content:
          'Anuncie no Studio Diamond. Planos Ruby, Diamante, Ouro e Prata com destaque na página inicial, venda de conteúdo e perfil completo.',
      },
    ],
  }),
  component: Anuncie,
})

function Anuncie() {
  const { total } = Route.useLoaderData()
  const { session } = useAuth()
  const vagasRestantes = Math.max(0, PROMO.vagas - total)
  const promoAtiva = vagasRestantes > 0
  // Logado vai contratar o plano; deslogado vai cadastrar primeiro.
  const destino = session ? '/painel/plano' : '/auth'

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="text-center">
        <h1 className="font-display text-4xl text-gold-300 sm:text-5xl">Anuncie no Studio Diamond</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Uma vitrine sofisticada, feita para mulheres que querem ser vistas pelo público certo.
          Escolha o plano que dá o brilho que você merece — seu perfil entra no ar após uma
          curadoria rápida.
        </p>
      </div>

      {/* PROMO DE LANÇAMENTO */}
      {promoAtiva && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gold-500/50 bg-gradient-to-r from-gold-500/10 to-transparent p-5 text-center">
          <div className="font-display text-lg text-gold-300">
            🎉 Promoção de lançamento — 30% OFF
          </div>
          <p className="mt-1 text-sm text-muted">
            Para os <b className="text-ink">{PROMO.vagas} primeiros cadastros</b>. Restam{' '}
            <b className="text-gold-300">
              {vagasRestantes} {vagasRestantes === 1 ? 'vaga' : 'vagas'}
            </b>{' '}
            com desconto no primeiro mês.
          </p>
        </div>
      )}

      {/* PLANOS */}
      <div className="mt-12 grid gap-6 lg:grid-cols-4">
        {PLANOS.map((p) => {
          const promo = precoComPromo(p.precoMes)
          return (
            <div
              key={p.slug}
              className={`relative flex flex-col rounded-3xl border bg-noir-900/60 p-6 ${
                p.popular ? 'border-gold-500/60 shadow-lg shadow-gold-700/10' : 'border-line'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-noir-950">
                  Recomendado
                </span>
              )}
              <span
                className={`w-fit rounded-full bg-gradient-to-r px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${PLANO_SELO[p.slug]}`}
              >
                {p.nome}
              </span>
              <p className="mt-3 text-sm text-muted">{p.resumo}</p>

              <div className="mt-5">
                {promoAtiva ? (
                  <>
                    <div className="text-xs text-muted line-through">{fmtBRL(p.precoMes)}</div>
                    <div className="font-display text-3xl text-gold-300">
                      {fmtBRL(promo)}
                      <span className="text-sm font-normal text-muted"> / 1º mês</span>
                    </div>
                  </>
                ) : (
                  <div className="font-display text-3xl">
                    {fmtBRL(p.precoMes)}
                    <span className="text-sm font-normal text-muted"> / mês</span>
                  </div>
                )}
              </div>

              {/* selo de venda de conteúdo */}
              <div className="mt-3 text-xs">
                {p.vendeConteudo ? (
                  <span className="text-emerald-400">
                    Venda de conteúdo {p.taxaVendaPct === 0 ? '· 0% de taxa' : `· ${p.taxaVendaPct}% de taxa`}
                  </span>
                ) : (
                  <span className="text-muted">Sem venda de conteúdo</span>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {p.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-0.5 text-gold-400">✦</span>
                    <span className="text-ink/90">{b}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={destino}
                className={`mt-6 rounded-xl px-5 py-3 text-center font-semibold transition ${
                  p.popular
                    ? 'bg-gradient-to-r from-gold-500 to-gold-700 text-white hover:brightness-110'
                    : 'border border-gold-500/40 text-gold-300 hover:bg-gold-500/10'
                }`}
              >
                Quero esse plano
              </Link>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Planos semanais e quinzenais sob consulta. Além da vitrine, você define seus próprios valores
        de hora e diária para o atendimento — esse ganho é 100% seu.
      </p>

      {/* COMO FUNCIONA */}
      <section className="mt-16">
        <h2 className="text-center font-display text-3xl">Como funciona</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            ['1', 'Crie sua conta', 'Cadastre-se e monte seu perfil com fotos, valores e atendimento.'],
            ['2', 'Escolha seu plano', 'Ruby, Diamante, Ouro ou Prata — você decide o nível de destaque.'],
            [
              '3',
              'Aprovação e no ar',
              'Conferimos seu material e ativamos o plano. Seu anúncio passa a aparecer em todo o Brasil.',
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-line bg-noir-900/60 p-6">
              <div className="font-display text-2xl text-gold-400">{n}</div>
              <div className="mt-2 font-display text-lg">{t}</div>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REQUISITOS / SEGURANÇA */}
      <section className="mt-14 rounded-2xl border border-line bg-noir-900/40 p-7">
        <h2 className="font-display text-xl text-gold-300">Para anunciar com segurança</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          O Studio Diamond é uma plataforma de anúncios — não somos agência e não intermediamos
          encontros. Para preservar a credibilidade da vitrine, toda anunciante deve ser maior de 18
          anos e comprovar identidade. Na aprovação pedimos um documento com foto e um vídeo de
          verificação, e você confirma que tem direito de uso sobre as imagens enviadas. Veja os{' '}
          <Link to="/termos" className="text-gold-400 underline">
            Termos de Uso
          </Link>
          .
        </p>
      </section>

      <div className="mt-12 text-center">
        <Link
          to={destino}
          className="inline-block rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-8 py-4 font-semibold text-white transition hover:brightness-110"
        >
          Começar meu cadastro →
        </Link>
      </div>
    </div>
  )
}
