import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from './supabase'

interface AuthState {
  loading: boolean
  session: Session | null
  user: User | null
  isAdmin: boolean
  /** Conta de cliente (assina conteúdo) — diferente de modelo/anunciante. */
  isCliente: boolean
}

/** Sessão do Supabase no cliente (o painel é client-side). */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    isAdmin: false,
    isCliente: false,
  })

  useEffect(() => {
    let ativo = true

    async function carregar(session: Session | null) {
      let isAdmin = false
      let isCliente = false
      if (session?.user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
        const roles = (data ?? []).map((r) => r.role)
        isAdmin = roles.includes('admin')
        // É cliente só quem tem o papel "cliente" e não é anunciante/admin.
        // (contas antigas sem papel seguem tratadas como modelo/anunciante.)
        isCliente = roles.includes('cliente') && !roles.includes('advertiser') && !isAdmin
      }
      if (ativo)
        setState({
          loading: false,
          session,
          user: session?.user ?? null,
          isAdmin,
          isCliente,
        })
    }

    supabase.auth.getSession().then(({ data }) => carregar(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      carregar(session)
    })
    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}
