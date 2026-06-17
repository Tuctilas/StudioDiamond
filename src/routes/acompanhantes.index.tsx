import { createFileRoute, redirect } from '@tanstack/react-router'

interface BuscaParams {
  cidade?: string[]
  categoria?: string[]
  fetiche?: string[]
  idade?: number
  preco?: string
}

function arr(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const out = v.filter((x): x is string => typeof x === 'string' && x.length > 0)
    return out.length ? out : undefined
  }
  if (typeof v === 'string' && v) return [v]
  return undefined
}

// A vitrine agora vive na home (/). Mantemos esta rota como redirecionamento
// para não quebrar links antigos (/acompanhantes?fetiche=...).
export const Route = createFileRoute('/acompanhantes/')({
  validateSearch: (s: Record<string, unknown>): BuscaParams => ({
    cidade: arr(s.cidade),
    categoria: arr(s.categoria),
    fetiche: arr(s.fetiche),
    idade: s.idade ? Number(s.idade) : undefined,
    preco: typeof s.preco === 'string' ? s.preco : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search })
  },
})
