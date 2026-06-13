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
- **Elogios** só no perfil de cada modelo (link global removido do header/footer).
- **Área de assinantes** (`/painel/assinaturas`): cliente vê o que assina, acessa/renova e recebe sugestões de modelos com as mesmas categorias.

---

## 🔴 Fase 3 — Pagamento real (crítico para faturar)
A peça que falta para o dinheiro existir de verdade. Decisão pendente: **provedor (Asaas recomendado, ou Mercado Pago)**.

1. **Onboarding de recebimento da modelo**: ✅ captura da **chave Pix** no painel (Carteira; saque bloqueado sem chave — rode `supabase/pix.sql`). Falta criar a subconta no provedor (KYC).
2. **Cobrança do plano de vitrine (a modelo paga)**: checkout recorrente mensal; ao confirmar, o admin não precisa mais setar o plano na mão.
3. **Assinatura VIP (o cliente paga)**: trocar o `assinar_vip` simulado por checkout real; aplicar o **split 85/15** (Ruby 0%) via provedor; creditar o líquido na carteira. (Taxa de 15% rodar `supabase/taxa-15.sql`.)
4. **Saque real**: o "Sacar" vira Pix de verdade via API do provedor; status atualizado por **webhook**.
5. **Webhooks** de pagamento aprovado/estornado/assinatura cancelada.
6. **Promoção dos 20 primeiros**: aplicar o desconto de fato na cobrança (hoje é só visual).
7. **Expiração de plano (`plano_expira`)**: quando vencer, rebaixar/pausar o anúncio automaticamente (cron/checagem).

## 🟠 Fase 4 — Experiência de cliente (quem assina)
8. **Separar login de cliente x modelo**: hoje `/auth` é compartilhado e um cliente cai no painel de anunciante. Criar papel/experiência de cliente.
9. ✅ **"Minhas assinaturas"** (`/painel/assinaturas`): cliente vê/acessa/renova as assinaturas + sugestões por categoria. Falta o cancelamento real (depende do provedor) e separar o login (item 8).
10. **Anti-spam**: honeypot/captcha + rate limit em elogios, comentários e cadastro (hoje qualquer um insere).

## 🟡 Fase 5 — Conteúdo rico do perfil (público)
Os planos prometem isso; ainda não existe na página pública:
11. **Vídeo de apresentação (making of)** por modelo.
12. **Áudio de apresentação** (toca sobre as primeiras fotos).
13. **Ensaios anteriores** (galerias adicionais).
14. **Banner/destaque na home**: área nobre com a foto de chamada das Ruby/Diamante (hoje só ordenamos por plano).

## 🟢 Ajustes e pendências
15. **Aprovação condicionada à verificação**: admin só "Aprovar" depois de marcar verificada.
16. **E-mails transacionais**: aprovação do anúncio, novo assinante, status de saque (hoje promete e-mail mas não envia).
17. **Política de Privacidade (LGPD)**: a `/privacidade` precisa de texto completo (guarda de documentos, retenção, direitos do titular).
18. **Revisão jurídica por advogado** dos Termos/Privacidade antes de ir ao ar pra valer.
19. ✅ **Menu mobile**: header com menu hambúrguer no celular (Acompanhantes/Elogios atrás do botão; CTA "Anunciar" sempre visível).
20. **Proteção extra do conteúdo VIP**: marca d'água com id do assinante (inibe vazamento), URLs assinadas curtas.
21. **Migração para o domínio/projeto definitivo**: confirmar se o Supabase é o `hnkviyz...` mesmo e trocar a senha do banco (passou pelo chat).

---

## Decisões em aberto
- **Provedor de pagamento**: Asaas (recomendado p/ Pix + split + subconta) vs Mercado Pago.
- **Separação de contas** cliente x modelo: fazer agora ou junto da Fase 3?
- **Preços finais** dos planos e da promo (valores atuais são ponto de partida).
