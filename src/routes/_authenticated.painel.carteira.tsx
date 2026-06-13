import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import type { PixTipo, WalletEntry } from '#/lib/supabase'
import { PIX_TIPOS, fmtBRL } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/carteira')({
  component: Carteira,
})

function saldoDe(entries: WalletEntry[]): number {
  return entries.reduce((acc, e) => {
    if (e.tipo === 'credito' && e.status === 'confirmado') return acc + Number(e.valor)
    if (e.tipo === 'saque' && e.status !== 'rejeitado') return acc - Number(e.valor)
    return acc
  }, 0)
}

const STATUS: Record<string, { txt: string; cor: string }> = {
  confirmado: { txt: 'confirmado', cor: 'text-emerald-400' },
  pendente: { txt: 'em análise', cor: 'text-yellow-400' },
  pago: { txt: 'pago', cor: 'text-emerald-400' },
  rejeitado: { txt: 'rejeitado', cor: 'text-red-400' },
}

function Carteira() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [valor, setValor] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [pixTipo, setPixTipo] = useState<PixTipo>('cpf')
  const [pixChave, setPixChave] = useState('')
  const [pixSalvo, setPixSalvo] = useState(false)
  const [pixBusy, setPixBusy] = useState(false)
  const [pixMsg, setPixMsg] = useState('')

  useEffect(() => {
    if (!user) return
    carregar()
    async function carregar() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, pix_tipo, pix_chave')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (p) {
        setPerfilId(p.id)
        if (p.pix_tipo) setPixTipo(p.pix_tipo as PixTipo)
        if (p.pix_chave) {
          setPixChave(p.pix_chave)
          setPixSalvo(true)
        }
        await recarregar(p.id)
      }
      setCarregando(false)
    }
  }, [user])

  async function recarregar(id: string) {
    const { data } = await supabase
      .from('wallet_entries')
      .select('*')
      .eq('profile_id', id)
      .order('created_at', { ascending: false })
    setEntries((data ?? []) as WalletEntry[])
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>
  if (!perfilId) {
    return (
      <div className="rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
        Crie seu perfil primeiro.{' '}
        <Link to="/painel/perfil" className="text-gold-400 underline">
          Criar perfil →
        </Link>
      </div>
    )
  }

  const saldo = saldoDe(entries)

  async function salvarPix() {
    setPixMsg('')
    const chave = pixChave.trim()
    if (!chave) {
      setPixMsg('Informe a chave Pix.')
      return
    }
    setPixBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ pix_tipo: pixTipo, pix_chave: chave })
      .eq('id', perfilId!)
    setPixBusy(false)
    if (error) {
      setPixMsg(error.message)
      return
    }
    setPixChave(chave)
    setPixSalvo(true)
    setPixMsg('✅ Chave Pix salva.')
  }

  async function sacar() {
    setMsg('')
    if (!pixSalvo) {
      setMsg('Cadastre sua chave Pix antes de sacar.')
      return
    }
    const v = valor ? Number(valor.replace(/\D/g, '')) : 0
    if (!v) {
      setMsg('Informe um valor.')
      return
    }
    if (v > saldo) {
      setMsg('Saldo insuficiente.')
      return
    }
    setBusy(true)
    const { error } = await supabase.rpc('solicitar_saque', {
      p_profile_id: perfilId,
      p_valor: v,
    })
    setBusy(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setValor('')
    setMsg('✅ Saque solicitado. O pagamento cai após a aprovação.')
    await recarregar(perfilId!)
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Minha carteira</h1>

      <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-transparent p-6">
        <div className="text-xs uppercase tracking-wider text-muted">Saldo disponível</div>
        <div className="mt-1 font-display text-4xl text-gold-300">{fmtBRL(saldo)}</div>
      </div>

      {/* CHAVE PIX */}
      <div className="mt-6 rounded-2xl border border-line bg-noir-900/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg">Conta para recebimento (Pix)</h2>
          {pixSalvo && <span className="text-xs text-emerald-400">✓ cadastrada</span>}
        </div>
        <p className="mt-1 text-xs text-muted">
          É para esta chave que o valor dos saques será enviado. Confira com atenção.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Tipo
            </label>
            <select
              value={pixTipo}
              onChange={(e) => setPixTipo(e.target.value as PixTipo)}
              className="rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
            >
              {PIX_TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Chave
            </label>
            <input
              value={pixChave}
              onChange={(e) => setPixChave(e.target.value)}
              className="w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </div>
          <button
            onClick={salvarPix}
            disabled={pixBusy}
            className="rounded-xl border border-gold-500/40 px-6 py-3 font-semibold text-gold-400 transition hover:bg-gold-500/10 disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
        {pixMsg && <p className="mt-3 text-sm text-gold-400">{pixMsg}</p>}
      </div>

      {/* SAQUE */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-noir-900/50 p-5">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Valor do saque (R$)
          </label>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
            placeholder="100"
          />
        </div>
        <button
          onClick={sacar}
          disabled={busy}
          className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          Sacar
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-gold-400">{msg}</p>}

      {/* EXTRATO */}
      <h2 className="mt-10 font-display text-2xl">Extrato</h2>
      <div className="mt-4 space-y-2">
        {entries.map((e) => {
          const st = STATUS[e.status] ?? STATUS.confirmado
          const credito = e.tipo === 'credito'
          return (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-noir-900 px-4 py-3 text-sm"
            >
              <div>
                <div className="text-ink">{e.descricao ?? (credito ? 'Crédito' : 'Saque')}</div>
                <div className="text-xs text-muted">
                  {new Date(e.created_at).toLocaleString('pt-BR')} ·{' '}
                  <span className={st.cor}>{st.txt}</span>
                </div>
              </div>
              <div className={`font-display text-lg ${credito ? 'text-emerald-400' : 'text-red-400'}`}>
                {credito ? '+' : '−'} {fmtBRL(Number(e.valor))}
              </div>
            </div>
          )
        })}
        {!entries.length && <p className="text-sm text-muted">Sem movimentações ainda.</p>}
      </div>
    </div>
  )
}
