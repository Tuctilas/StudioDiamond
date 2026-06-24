import { Link } from '@tanstack/react-router'

import { cidadePorSlug } from '#/lib/cidades'
import { PLANO_SELO, planoPorSlug } from '#/lib/planos'
import { fmtBRL } from '#/lib/supabase'
import type { ProfileComCapa } from '#/lib/queries'

export function ProfileCard({ p }: { p: ProfileComCapa }) {
  const cidade = p.cidade ? cidadePorSlug(p.cidade) : undefined
  const plano = planoPorSlug(p.plano)
  return (
    <Link
      to="/acompanhantes/$slug"
      params={{ slug: p.slug }}
      className="group relative block overflow-hidden rounded-2xl border border-gold-500/10 bg-noir-800 shadow-lg transition hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-gold-700/20"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {p.capa_video_url ? (
          <video
            src={p.capa_video_url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : p.capa_url ? (
          <img
            src={p.capa_url}
            alt={p.nome_exibicao}
            loading="lazy"
            style={{ objectPosition: `${p.capa_foco_x}% ${p.capa_foco_y}%` }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-noir-700 text-xs uppercase tracking-widest text-muted">
            [ foto ]
          </div>
        )}
        {plano ? (
          <span
            className={`absolute right-3 top-3 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PLANO_SELO[plano.slug]}`}
          >
            {plano.nome}
          </span>
        ) : (
          p.destaque && (
            <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-noir-950">
              Destaque
            </span>
          )
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir-950/95 via-noir-950/55 to-transparent p-4 pt-12">
          <div className="font-display text-xl text-gold-300">{p.nome_exibicao}</div>
          <div className="mt-0.5 flex items-center justify-between text-xs text-muted">
            <span>
              {cidade ? `${cidade.nome} · ${cidade.estado}` : ''}
              {p.bairro ? ` — ${p.bairro}` : ''}
            </span>
            {p.preco_hora != null && (
              <span className="font-semibold text-gold-300">{fmtBRL(p.preco_hora)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
