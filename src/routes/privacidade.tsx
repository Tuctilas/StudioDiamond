import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacidade')({
  head: () => ({
    meta: [
      { title: 'Política de Privacidade — Studio Diamond' },
      { name: 'description', content: 'Política de privacidade da plataforma Studio Diamond (LGPD).' },
    ],
  }),
  component: Privacidade,
})

function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 text-sm leading-relaxed text-muted">
      <h1 className="font-display text-3xl text-ink">Política de Privacidade</h1>
      <p className="mt-2 text-xs text-muted">Última atualização: junho de 2026.</p>
      <p className="mt-4">
        Esta Política explica como o Studio Diamond (“plataforma”) coleta, usa, compartilha e protege
        dados pessoais, em conformidade com a <b>Lei Geral de Proteção de Dados — LGPD (Lei nº
        13.709/2018)</b>. O Studio Diamond é uma plataforma de anúncios para pessoas maiores de 18
        anos; não somos agência e não intermediamos encontros.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">1. Dados que coletamos</h2>
      <p className="mt-2"><b>De visitantes:</b> confirmação de idade (guardada no seu navegador) e dados técnicos
        básicos de acesso/segurança. Não exigimos cadastro para navegar.</p>
      <p className="mt-2"><b>De clientes (assinantes):</b> e-mail e senha de acesso; e, ao assinar conteúdo, nome
        completo, CPF e data de nascimento, necessários para emitir a cobrança (Pix) e confirmar a
        maioridade; histórico de assinaturas e pagamentos.</p>
      <p className="mt-2"><b>De anunciantes (modelos):</b> e-mail e senha; dados do perfil (nome de exibição,
        características, valores, contato, fotos e vídeos); documento de identidade e vídeo de
        verificação (armazenados em área restrita, visíveis apenas à moderação); chave Pix e dados
        para recebimento; aceite dos Termos com data e hora.</p>

      <h2 className="mt-8 font-display text-xl text-ink">2. Para que usamos e bases legais</h2>
      <p className="mt-2">
        Usamos os dados para: operar a plataforma e a conta (execução de contrato); processar
        pagamentos e repasses (execução de contrato); <b>verificar a maioridade</b> e prevenir
        fraudes (cumprimento de obrigação legal e legítimo interesse); moderar e dar segurança ao
        serviço (legítimo interesse); e enviar comunicações da conta. Dados sensíveis e o
        consentimento informado são tratados conforme a finalidade declarada no momento da coleta.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">3. Com quem compartilhamos</h2>
      <p className="mt-2">
        Não vendemos dados pessoais. Compartilhamos apenas com prestadores que viabilizam o serviço
        (operadores), no limite necessário:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li><b>Supabase</b> — banco de dados, autenticação e armazenamento de arquivos.</li>
        <li><b>Asaas</b> — instituição de pagamento; recebe nome, CPF e e-mail para emitir cobranças,
          Pix e repasses.</li>
        <li><b>Cloudflare</b> — hospedagem, rede de entrega e segurança.</li>
      </ul>
      <p className="mt-2">Também podemos compartilhar dados quando exigido por lei ou autoridade competente.</p>

      <h2 className="mt-8 font-display text-xl text-ink">4. Verificação de idade e conteúdo adulto</h2>
      <p className="mt-2">
        O acesso é restrito a maiores de 18 anos. A maioridade é confirmada na entrada do site e
        novamente no momento da assinatura de conteúdo, pela data de nascimento. Anunciantes passam
        por verificação de identidade com documento e vídeo.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">5. Cookies e armazenamento local</h2>
      <p className="mt-2">
        Usamos armazenamento local/cookies essenciais para manter sua sessão e a confirmação de
        idade. Não usamos cookies de publicidade de terceiros.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">6. Retenção</h2>
      <p className="mt-2">
        Guardamos os dados pelo tempo necessário às finalidades acima e ao cumprimento de obrigações
        legais (por exemplo, registros fiscais e de verificação de idade). Encerrada a conta, os
        dados são eliminados ou anonimizados, ressalvado o que a lei exigir reter.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">7. Segurança</h2>
      <p className="mt-2">
        Adotamos medidas técnicas e organizacionais para proteger os dados (controle de acesso,
        criptografia em trânsito, área restrita para documentos de verificação). Nenhum sistema é
        100% imune; em caso de incidente relevante, agiremos conforme a LGPD.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">8. Seus direitos (art. 18 da LGPD)</h2>
      <p className="mt-2">
        Você pode solicitar: confirmação e acesso aos seus dados; correção; anonimização, bloqueio ou
        eliminação de dados desnecessários; portabilidade; informação sobre compartilhamentos; e
        revogação do consentimento. Anunciantes e clientes também podem editar ou excluir a própria
        conta pelo painel.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">9. Como exercer seus direitos / Encarregado (DPO)</h2>
      <p className="mt-2">
        Para exercer qualquer direito ou tirar dúvidas sobre esta Política, fale com nosso Encarregado
        de Proteção de Dados pelo e-mail{' '}
        <a href="mailto:studio.diamond031@gmail.com" className="text-gold-400 underline">
          studio.diamond031@gmail.com
        </a>
        . Responderemos nos prazos da LGPD.
      </p>

      <h2 className="mt-8 font-display text-xl text-ink">10. Alterações</h2>
      <p className="mt-2">
        Podemos atualizar esta Política. A versão vigente é sempre a publicada nesta página, com a
        data de atualização indicada no topo.
      </p>
    </div>
  )
}
