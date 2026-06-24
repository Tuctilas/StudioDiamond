-- ============================================================
--  Atualiza a taxa da plataforma sobre vendas de conteúdo VIP:
--  10% -> 15% (Ruby segue isento). Rode UMA vez no SQL Editor.
--  Só redefine a função; não toca em dados nem em assinaturas já feitas.
-- ============================================================

-- ⚠️ SEGURANÇA (24/06/2026): este arquivo redefinia assinar_vip, que liberava
-- VIP de graça (insere assinatura + credita carteira SEM pagamento). Obsoleto:
-- hoje a taxa de 15% é aplicada dentro das funções confirmar_pagamento_vip /
-- confirmar_presente, chamadas só pelo webhook após o pagamento real.
-- Em vez de recriar a função vulnerável, removemos. Ver supabase/seguranca-rpc.sql.
drop function if exists public.assinar_vip(uuid);
