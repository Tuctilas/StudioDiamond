import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { fmtBRL, supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/presentes')({
  component: Presentes,
})

type GiftRef = { nome: string; emoji: string } | null

type Recebido = {
  id: string
  valor: number
  mensagem: string | null
  anonimo: boolean
  sender_apelido: string | null
  resposta: string | null
  created_at: string
  gifts: GiftRef
}

type Enviado = {
  id: string
  valor: number
  mensagem: string | null
  resposta: string | null
  status: string
  created_at: string
  gifts: GiftRef
  profiles: { nome_exibicao: string; slug: string } | null
}

function Presentes() {
  const { user, isCliente } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [recebidos, setRecebidos] = useState<Recebido[]>([])
  const [enviados, setEnviados] = useState<Enviado[]>([])
  const [rascunho, setRascunho] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    let cancel = false
    async function carregar() {
      if (isCliente) {
        const { data } = await supabase
          .from('gift_sends')
          .select('id, valor, mensagem, resposta, status, created_at, gifts(nome, emoji), profiles(nome_exibicao, slug)')
          .eq('sender_id', user!.id)
          .order('created_at', { ascending: false })
        if (!cancel) setEnviados((data as unknown as Enviado[]) ?? [])
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle()
        if (prof) {
          const { data } = await supabase
            .from('gift_sends')
            .select('id, valor, mensagem, anonimo, sender_apelido, resposta, created_at, gifts(nome, emoji)')
            .eq('profile_id', prof.id)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })
          if (!cancel) setRecebidos((data as unknown as Recebido[]) ?? [])
        }
      }
      if (!cancel) setCarregando(false)
    }
    carregar()
    return () => {
      cancel = true
    }
  }, [user, isCliente])

  async function responder(id: string) {
    const texto = (rascunho[id] ?? '').trim()
    if (!texto) return
    const { error } = await supabase.rpc('responder_presente', { p_send_id: id, p_texto: texto })
    if (!error) {
      setRecebidos((rs) => rs.map((r) => (r.id === id ? { ...r, resposta: texto } : r)))
      setRascunho((d) => ({ ...d, [id]: '' }))
    }
  }

  const data = (s: string) => new Date(s).toLocaleDateString('pt-BR')

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>

  // ───────── CLIENTE: presentes que ENVIOU ─────────
  if (isCliente) {
    return (
      <div>
        <h1 className="font-display text-3xl">Meus recados</h1>
        <p className="mt-1 text-sm text-muted">Presentes que você enviou e as respostas.</p>
        {enviados.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
            Você ainda não enviou presentes.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {enviados.map((e) => (
              <li key={e.id} className="rounded-2xl border border-line bg-noir-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink">
                    {e.gifts?.emoji} {e.gifts?.nome} para{' '}
                    {e.profiles ? (
                      <Link to="/acompanhantes/$slug" params={{ slug: e.profiles.slug }} className="text-gold-300 underline">
                        {e.profiles.nome_exibicao}
                      </Link>
                    ) : (
                      'modelo'
                    )}
                  </span>
                  <span className="font-display text-gold-300">{fmtBRL(Number(e.valor))}</span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {data(e.created_at)} ·{' '}
                  {e.status === 'confirmed' ? 'pago' : e.status === 'pending' ? 'aguardando pagamento' : e.status}
                </div>
                {e.mensagem && <p className="mt-2 text-sm text-ink/90">“{e.mensagem}”</p>}
                {e.resposta && (
                  <p className="mt-2 rounded-xl border border-gold-500/30 bg-gold-500/5 px-3 py-2 text-sm text-gold-200">
                    Resposta: {e.resposta}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // ───────── MODELO: presentes que RECEBEU ─────────
  return (
    <div>
      <h1 className="font-display text-3xl">Presentes recebidos</h1>
      <p className="mt-1 text-sm text-muted">Recados dos seus apoiadores — responda quem quiser.</p>
      {recebidos.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
          Nenhum presente recebido ainda.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {recebidos.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-noir-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink">
                  {r.gifts?.emoji} {r.gifts?.nome} de{' '}
                  <b className="text-gold-300">{r.sender_apelido || 'Apoiador'}</b>
                  {r.anonimo && <span className="ml-1 text-xs text-muted">(anônimo no ranking)</span>}
                </span>
                <span className="font-display text-gold-300">{fmtBRL(Number(r.valor))}</span>
              </div>
              <div className="mt-1 text-xs text-muted">{data(r.created_at)}</div>
              {r.mensagem && <p className="mt-2 text-sm text-ink/90">“{r.mensagem}”</p>}
              {r.resposta ? (
                <p className="mt-2 rounded-xl border border-gold-500/30 bg-gold-500/5 px-3 py-2 text-sm text-gold-200">
                  Você respondeu: {r.resposta}
                </p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={rascunho[r.id] ?? ''}
                    onChange={(e) => setRascunho((d) => ({ ...d, [r.id]: e.target.value }))}
                    placeholder="Responder…"
                    className="flex-1 rounded-lg border border-line bg-noir-800 px-3 py-1.5 text-sm outline-none focus:border-gold-500"
                  />
                  <button
                    onClick={() => responder(r.id)}
                    className="rounded-lg border border-gold-500/50 px-3 py-1.5 text-sm text-gold-300 hover:bg-gold-500/10"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
