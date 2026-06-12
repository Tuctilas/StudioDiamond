import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Entrar ou anunciar — Studio Diamond' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Auth,
})

function Auth() {
  const navigate = useNavigate()
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceite, setAceite] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!email || senha.length < 6) {
      setMsg('Preencha o e-mail e uma senha com 6+ caracteres.')
      return
    }
    if (modo === 'cadastro' && !aceite) {
      setMsg('Você precisa confirmar 18+ e aceitar os termos.')
      return
    }
    setBusy(true)
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      } else {
        const { error, data } = await supabase.auth.signUp({ email, password: senha })
        if (error) throw error
        if (!data.session) {
          setMsg('Conta criada! Confirme seu e-mail e entre novamente.')
          setBusy(false)
          return
        }
      }
      navigate({ to: '/painel' })
    } catch (err: any) {
      setMsg(err?.message ?? 'Erro ao autenticar.')
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-center font-display text-3xl">
        {modo === 'login' ? 'Entrar no painel' : 'Anuncie no Studio Diamond'}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {modo === 'login'
          ? 'Acesso para anunciantes cadastradas.'
          : 'Crie sua conta, monte seu perfil e apareça para milhares de visitantes.'}
      </p>

      <form onSubmit={enviar} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
            Senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500"
          />
        </div>

        {modo === 'cadastro' && (
          <label className="flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Confirmo que tenho <b>18 anos ou mais</b>, que o anúncio é meu e
              aceito os termos de uso e a política de privacidade.
            </span>
          </label>
        )}

        {msg && <p className="text-sm text-gold-400">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button
        onClick={() => {
          setModo(modo === 'login' ? 'cadastro' : 'login')
          setMsg('')
        }}
        className="mt-6 w-full text-center text-sm text-muted underline transition hover:text-ink"
      >
        {modo === 'login'
          ? 'Não tem conta? Anuncie agora'
          : 'Já tem conta? Entrar'}
      </button>
    </div>
  )
}
