/*
  # Atualizar tabela users para autenticação Supabase

  1. Alterações
    - Remover tabela users existente pois o Supabase já gerencia a autenticação
    - A tabela auth.users será usada automaticamente pelo Supabase

  2. Segurança
    - A autenticação será gerenciada pelo Supabase Auth
    - Não é necessário políticas RLS pois o Supabase Auth já cuida da segurança
*/

-- Remover a tabela users existente pois vamos usar a auth.users do Supabase
DROP TABLE IF EXISTS public.users;