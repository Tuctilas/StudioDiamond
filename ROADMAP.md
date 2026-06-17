# Studio Diamond — Roadmap

Lista das próximas alterações, em ordem de prioridade. Atualizado em jun/2026.

## ✅ Já pronto
- Identidade visual (logo no header, favicon "S").
- Filtros na lateral (cidade, categoria, fetiche, idade, valor) com multi-seleção.
- Cadastro rico da modelo (perfil físico, persona, serviços, fetiches, conteúdo, logística, idiomas, regras).
- Elogios (geral + por modelo) com moderação.
- Planos de vitrine: **Ruby R$1.900 · Diamante R$1.500 · Ouro R$800 · Prata R$400**, com selo e ordenação na vitrine.
- Promoção de lançamento (30% off p/ os 20 primeiros) — só exibição por enquanto.
- Bloqueio de download das mídias (deter, não DRM).
- Bloco legal: Termos reescritos + verificação (documento/vídeo em bucket privado, aceite com data/hora).
- **Fase 2 VIP**: área restrita por modelo, comentários moderáveis, carteira e **split** (Ruby 0%, Ouro/Diamante 15%, Prata bloqueado). A modelo define o próprio preço do conteúdo. **Pagamento ainda SIMULADO.**
- **Elogios** só no perfil de cada modelo (página global `/elogios` removida; elogio por modelo no perfil segue ativo).
- **Contas separadas cliente x modelo**: cadastro escolhe o tipo (`/auth`, papel salvo via metadata + trigger `handle_new_user`); o painel se adapta ao papel. Header tem botão **Entrar** (cliente e anunciante). Admin vê só painel de moderação (sem opções de cliente/assinante). Contas antigas sem papel seguem como modelo.
- **Área de assinantes** (`/painel/assinaturas`): cliente vê o que assina, acessa/renova, **cancela** (RPC `cancelar_vip`) e recebe sugestões de modelos com as mesmas categorias. A modelo tem **"Assinantes"** (`/painel/assinantes`) no lugar de "Minhas assinaturas".
- **Vídeo de capa**: a modelo pode usar um vídeo como mídia principal (coluna `capa_video_url`, upload em Galeria; aparece no card e no perfil).
- **Galerias com revisão**: foto e VIP só publicam depois do botão **Publicar** (seleção fica em "Para publicar").
- **Galeria com vídeo + tamanhos misto**: conteúdo comum e VIP aceitam foto e vídeo (`profile_photos.tipo`); player abre/cresce/tela cheia mas **sem download**; retrato menor / paisagem maior (orientação automática via `GaleriaItem`).
- **Redes sociais** da modelo (Instagram/X/TikTok/Telegram) com ícones no perfil, só se houver link.
- Área VIP **re-tematizada pro dourado** (saiu o rosa/vermelho).
- **Age gate +18** simples na entrada do site (sessionStorage — reaparece a cada nova sessão). A verificação por **data de nascimento** (18+) acontece no checkout da assinatura VIP, onde o CPF já é coletado.
- **Vitrine na home**: a `/` já mostra os filtros (cidade no topo + categoria/fetiche/idade/valor na lateral) e a listagem; `/acompanhantes` redireciona pra `/`; link "Acompanhantes" saiu do header.

---

## 🔴 Fase 3 — Pagamento real (crítico para faturar)
A peça que falta para o dinheiro existir de verdade. **Provedor escolhido: Asaas** (Pix + split + subconta). Falta abrir a conta + KYC e integrar.

1. **Onboarding de recebimento da modelo**: ✅ captura da **chave Pix** no painel (Carteira; saque bloqueado sem chave — rode `supabase/pix.sql`). Falta criar a subconta no provedor (KYC).
2. **Cobrança do plano de vitrine (a modelo paga)**: 🟡 código pronto — página `/painel/plano` + Pix via Asaas (mesma `asaas-criar-cobranca` com `tipo:'plano'`); ao confirmar, o webhook define `plano` + `plano_expira` (30d) sozinho. NÃO publica o perfil (verificação segue com o admin). Falta deploy + teste. Recorrência automática fica pra depois. Ver `supabase/plano-pagamento.sql`.
3. **Assinatura VIP (o cliente paga)**: 🟡 código pronto (Edge Functions `asaas-criar-cobranca` + `asaas-webhook`, tabela `vip_charges`, checkout Pix na VipArea com split 85/15). Falta **deployar as funções + configurar secrets/webhook + testar no sandbox**. Ver `supabase/asaas-pagamentos.sql` e `supabase/functions/`.
4. **Saque real**: o "Sacar" vira Pix de verdade via API do provedor; status atualizado por **webhook**.
5. **Webhooks** de pagamento aprovado/estornado/assinatura cancelada.
6. **Promoção dos 20 primeiros**: aplicar o desconto de fato na cobrança (hoje é só visual).
7. **Expiração de plano (`plano_expira`)**: quando vencer, rebaixar/pausar o anúncio automaticamente (cron/checagem).

## 🟠 Fase 4 — Experiência de cliente (quem assina)
8. ✅ **Login cliente x modelo separado**: cadastro escolhe o tipo; papel `cliente` salvo via metadata + trigger; painel se adapta (`isCliente`). Falta só o fluxo de e-mail de confirmação caprichado por papel.
9. ✅ **"Minhas assinaturas"** (`/painel/assinaturas`): cliente vê/acessa/renova/**cancela** + sugestões por categoria. Cancelamento hoje remove o acesso; a não-renovação no provedor entra na Fase 3.
10. 🟡 **Anti-spam**: honeypot + tempo mínimo no formulário de elogios já feito. Falta camada forte (Cloudflare Turnstile) e rate limit em comentários/cadastro.

## 🟡 Fase 5 — Conteúdo rico do perfil (público)
Os planos prometem isso; ainda não existe na página pública:
11. ✅ **Vídeo de capa** por modelo (mídia principal na vitrine/perfil). Falta, se quiser, vídeo extra "making of" separado da capa.
12. **Áudio de apresentação** (toca sobre as primeiras fotos).
13. **Ensaios anteriores** (galerias adicionais).
14. **Banner/destaque na home**: área nobre com a foto de chamada das Ruby/Diamante (hoje só ordenamos por plano).

## 🟢 Ajustes e pendências
15. **Aprovação condicionada à verificação**: admin só "Aprovar" depois de marcar verificada.
16. **E-mails transacionais**: aprovação do anúncio, novo assinante, status de saque (hoje promete e-mail mas não envia).
17. ✅ **Política de Privacidade (LGPD)**: `/privacidade` reescrita completa (dados coletados por tipo de usuário, bases legais, operadores Supabase/Asaas/Cloudflare, retenção, direitos art. 18, verificação de idade). Falta revisão jurídica (item 18).
18. **Revisão jurídica por advogado** dos Termos/Privacidade antes de ir ao ar pra valer.
19. ✅ **Menu mobile**: header com menu hambúrguer no celular (Acompanhantes atrás do botão; CTA "Anunciar" sempre visível).
20. **Proteção extra do conteúdo VIP**: marca d'água com id do assinante (inibe vazamento), URLs assinadas curtas.
21. **Migração para o domínio/projeto definitivo**: confirmar se o Supabase é o `hnkviyz...` mesmo e trocar a senha do banco (passou pelo chat).

---

## Decisões em aberto
- **Preços finais** dos planos e da promo (valores atuais são ponto de partida).

## Decididas
- **Provedor de pagamento: Asaas** (Pix + split + subconta). Próximo: abrir conta + KYC + integração.
