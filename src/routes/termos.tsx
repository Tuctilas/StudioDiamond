import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/termos')({
  head: () => ({
    meta: [
      { title: 'Termos de Uso — Studio Diamond' },
      {
        name: 'description',
        content:
          'Termos de uso do Studio Diamond: plataforma de anúncios, verificação de anunciantes, direitos de imagem, responsabilidade e regras de conteúdo.',
      },
    ],
  }),
  component: Termos,
})

function Item({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ink">{titulo}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

function Termos() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 text-sm leading-relaxed text-muted">
      <h1 className="font-display text-3xl text-ink">Termos de Uso</h1>
      <p className="mt-4">
        Ao acessar ou utilizar o Studio Diamond (“plataforma”, “site”), você declara ter{' '}
        <b>18 anos ou mais</b>, ter plena capacidade civil e concordar integralmente com estes Termos
        e com a{' '}
        <a href="/privacidade" className="text-gold-400 underline">
          Política de Privacidade
        </a>
        . Se não concordar, não utilize a plataforma. Anunciantes e clientes aceitam estes Termos de
        forma expressa no cadastro, com registro de data e hora, o que tem plena validade jurídica
        (art. 10, §2º, da MP 2.200-2/2001 e art. 219 do Código Civil).
      </p>

      <Item titulo="1. Definições">
        <ul className="ml-5 list-disc space-y-1">
          <li><b>Plataforma / site:</b> o Studio Diamond, mero espaço de hospedagem de anúncios.</li>
          <li><b>Anunciante:</b> pessoa maior de 18 anos, autônoma e independente, que contrata espaço para publicar seu anúncio.</li>
          <li><b>Usuário / cliente:</b> visitante maior de 18 anos que acessa o conteúdo ou assina conteúdo exclusivo.</li>
          <li><b>Conteúdo:</b> textos, fotos, vídeos, áudios e dados publicados pela anunciante.</li>
        </ul>
      </Item>

      <Item titulo="2. Natureza da plataforma — não somos agência">
        <p>
          O Studio Diamond é uma <b>plataforma de classificados/anúncios</b>. <b>Não somos agência</b>,
          não empregamos, não gerenciamos, não representamos, não agenciamos e <b>não intermediamos</b>{' '}
          encontros, serviços, combinações ou pagamentos entre anunciantes e usuários. Nossa receita
          decorre exclusivamente dos planos de publicação e de assinaturas de conteúdo — nunca de
          eventuais encontros.
        </p>
        <p>
          Valores, locais, dias, horários, a existência e a natureza de qualquer combinação são
          tratados <b>direta e exclusivamente</b> entre anunciante e usuário, sob responsabilidade
          integral de ambos. A plataforma não participa, não fiscaliza, não acompanha e não se
          responsabiliza por essas tratativas nem por seus desdobramentos.
        </p>
      </Item>

      <Item titulo="3. Ausência de vínculo">
        <p>
          Estes Termos não criam entre a plataforma e a anunciante qualquer vínculo empregatício,
          societário, de parceria, mandato, representação ou associação. A anunciante atua de forma{' '}
          <b>autônoma e por conta e risco próprios</b>, arcando integralmente com suas obrigações
          legais, fiscais, tributárias e previdenciárias.
        </p>
      </Item>

      <Item titulo="4. Cadastro e verificação da anunciante">
        <p>Para publicar, a anunciante deve, no cadastro:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>confirmar e comprovar ser maior de 18 anos;</li>
          <li>enviar documento oficial com foto (RG, CNH, CTPS ou Passaporte);</li>
          <li>gravar um breve vídeo de identificação e de autorização de uso de imagem;</li>
          <li>aceitar expressamente estes Termos; e</li>
          <li>efetuar o pagamento do plano escolhido.</li>
        </ul>
        <p>
          Esses dados de verificação são <b>confidenciais</b>, guardados em área restrita e acessíveis
          apenas à moderação, para conferência de identidade e maioridade. A publicação só ocorre após
          aprovação da moderação.
        </p>
      </Item>

      <Item titulo="5. Responsabilidade integral da anunciante">
        <p>
          A anunciante é a <b>única e exclusiva responsável</b> pelo conteúdo do seu anúncio (textos,
          fotos, vídeos e áudios), pela veracidade e atualização das informações, pela licitude de
          suas atividades, pelos serviços que eventualmente preste, e por todos os tributos e
          obrigações deles decorrentes. As informações publicadas são de sua inteira responsabilidade,
          assim como os acertos com seus clientes.
        </p>
        <p>
          Ao publicar, a anunciante <b>declara e garante</b> que: (i) é a pessoa retratada no material;
          (ii) é maior de 18 anos; (iii) detém todos os direitos e autorizações necessários para
          divulgar as imagens e demais conteúdos; e (iv) o conteúdo não viola lei, direito de terceiros
          ou estes Termos.
        </p>
      </Item>

      <Item titulo="6. Garantia e indenização (isenção da plataforma)">
        <p>
          A anunciante e o usuário concordam em <b>defender, indenizar e isentar</b> o Studio Diamond,
          seus titulares, sócios, administradores e colaboradores de toda e qualquer reclamação,
          notificação, ação judicial ou administrativa, perda, dano, multa, condenação ou despesa
          (incluindo <b>honorários advocatícios e custas</b>) que decorra, direta ou indiretamente:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>do conteúdo publicado ou da conduta da própria parte;</li>
          <li>da violação destes Termos ou da lei;</li>
          <li>da violação de direitos de terceiros (autorais, de imagem, de personalidade, etc.);</li>
          <li>de quaisquer encontros, serviços, negociações ou pagamentos firmados a partir do anúncio.</li>
        </ul>
        <p>
          Fica assegurado à plataforma o <b>direito de regresso</b> por qualquer valor que venha a ser
          obrigada a pagar em razão de ato de terceiro, anunciante ou usuário.
        </p>
      </Item>

      <Item titulo="7. Direitos autorais e de imagem">
        <p>
          Os direitos autorais de fotos e vídeos pertencem a quem os produziu — o fotógrafo ou criador
          —, nos termos da <b>Lei nº 9.610/98</b> (art. 7º, VII). Os direitos de imagem pertencem à
          pessoa retratada. Cabe exclusivamente à anunciante garantir que possui autorização do autor
          e o consentimento dos retratados para publicar o material com finalidade comercial.
        </p>
        <p>
          A plataforma <b>não é proprietária, produtora nem guardiã</b> do material, não mantém cópia
          de segurança e <b>não é fonte de recuperação</b> de arquivos. Questões de propriedade das
          imagens resolvem-se exclusivamente entre a anunciante, o fotógrafo e eventuais assessorias.
          Pedidos de remoção por uso indevido de imagem podem ser feitos pelo e-mail{' '}
          <a href="mailto:studio.diamond031@gmail.com" className="text-gold-400 underline">
            studio.diamond031@gmail.com
          </a>{' '}
          e são tratados com prioridade; a plataforma não responde pelo uso indevido do material por
          terceiros.
        </p>
      </Item>

      <Item titulo="8. Conteúdo proibido — tolerância zero">
        <p>É terminantemente proibido publicar ou solicitar:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>qualquer conteúdo envolvendo menores de 18 anos ou que aparente menoridade (crime — ECA, Lei 8.069/90);</li>
          <li>conteúdo de terceiros, fotos falsas ou que não correspondam à anunciante;</li>
          <li>conteúdo sem o consentimento da pessoa retratada, inclusive imagens íntimas não consentidas;</li>
          <li>material que indique tráfico de pessoas, exploração, coação ou qualquer crime;</li>
          <li>qualquer atividade ilegal.</li>
        </ul>
        <p>
          Conteúdo dessa natureza é removido imediatamente e <b>comunicado às autoridades competentes</b>,
          com preservação de registros, na forma da lei.
        </p>
      </Item>

      <Item titulo="9. Responsabilidade por conteúdo de terceiros (Marco Civil da Internet)">
        <p>
          Na forma da <b>Lei nº 12.965/2014 (Marco Civil da Internet)</b>, a plataforma, como provedora
          de aplicações, <b>não responde</b> por conteúdo gerado por anunciantes ou usuários, salvo se,
          após <b>ordem judicial específica</b>, não tomar providências para a sua remoção (art. 19).
          Em caso de divulgação de imagens íntimas sem consentimento, a remoção ocorre mediante simples
          notificação do interessado (art. 21). A plataforma age de forma diligente diante de
          notificações fundamentadas.
        </p>
      </Item>

      <Item titulo="10. Conteúdo VIP, assinaturas e pagamentos">
        <p>
          A área restrita (“VIP”) hospeda conteúdo exclusivo definido e fornecido pela anunciante, que
          dele é a única responsável. Os pagamentos (planos e assinaturas) são processados por{' '}
          <b>instituição de pagamento parceira</b>; a plataforma não armazena dados completos de cartão.
        </p>
        <p>
          O acesso ao conteúdo VIP é <b>pessoal e intransferível</b>. É expressamente proibido gravar,
          copiar, redistribuir, revender ou divulgar, por qualquer meio, o conteúdo exclusivo. O
          usuário que o fizer responde civil e criminalmente e indenizará a anunciante e a plataforma.
        </p>
      </Item>

      <Item titulo="11. Planos, publicação, validade e remoção">
        <p>
          A anunciante pode <b>pausar ou excluir</b> o próprio anúncio a qualquer momento pelo painel.
          O período contratado deve ser usufruído dentro do prazo de validade informado no momento da
          contratação. A plataforma pode interromper a publicação de qualquer anúncio em caso de
          violação destes Termos, denúncias fundamentadas ou término do plano, <b>sem obrigatoriedade
          de comunicação prévia</b> nesses casos, e sem direito a reembolso quando houver violação.
        </p>
      </Item>

      <Item titulo="12. Diretrizes de qualidade e reserva de direito">
        <p>
          Para preservar a credibilidade da vitrine, podemos, a nosso critério, recusar, editar a
          disposição ou não renovar anúncios que não atendam ao padrão do site — por exemplo, fotos com
          clientes, sem resolução adequada, com símbolos religiosos, militares ou de natureza sensível,
          ou que não representem interesse comercial compatível com a plataforma.
        </p>
      </Item>

      <Item titulo="13. Conduta do usuário">
        <p>
          O usuário compromete-se a usar a plataforma de forma lícita e respeitosa, a não assediar
          anunciantes, a não tentar burlar a verificação de idade e a não utilizar o conteúdo para fins
          ilícitos. O descumprimento autoriza o bloqueio do acesso, sem prejuízo das medidas cabíveis.
        </p>
      </Item>

      <Item titulo="14. Limitação de responsabilidade">
        <p>
          A plataforma fornece o serviço <b>“no estado em que se encontra”</b>, sem garantia de
          disponibilidade ininterrupta, de resultado ou de conduta de terceiros. Não nos
          responsabilizamos por danos diretos ou indiretos decorrentes de contatos, encontros,
          negociações ou pagamentos realizados a partir dos anúncios, nem por caso fortuito ou força
          maior. O uso da plataforma é por conta e risco de cada parte.
        </p>
      </Item>

      <Item titulo="15. Privacidade e proteção de dados (LGPD)">
        <p>
          Tratamos dados pessoais conforme a <b>LGPD (Lei nº 13.709/18)</b>. Documentos e vídeos de
          verificação têm acesso restrito e finalidade exclusiva de conferência de identidade e
          maioridade. Detalhes na{' '}
          <a href="/privacidade" className="text-gold-400 underline">
            Política de Privacidade
          </a>
          .
        </p>
      </Item>

      <Item titulo="16. Disposições gerais">
        <p>
          A eventual tolerância quanto a qualquer descumprimento não significa renúncia ou novação. Se
          alguma cláusula for considerada inválida, as demais permanecem em pleno vigor. Estes Termos
          podem ser atualizados a qualquer momento; a versão vigente é a publicada nesta página.
        </p>
      </Item>

      <Item titulo="17. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de{' '}
          <b>Belo Horizonte/MG</b> para dirimir quaisquer questões não resolvidas amigavelmente, com
          renúncia a qualquer outro, por mais privilegiado que seja.
        </p>
      </Item>

      <Item titulo="18. Contato">
        <p>
          Dúvidas, solicitações ou denúncias:{' '}
          <a href="mailto:studio.diamond031@gmail.com" className="text-gold-400 underline">
            studio.diamond031@gmail.com
          </a>
          .
        </p>
      </Item>

      <p className="mt-10 text-xs text-muted">Última atualização: junho de 2026.</p>
    </div>
  )
}
