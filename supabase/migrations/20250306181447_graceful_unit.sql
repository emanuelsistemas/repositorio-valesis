/*
  # Criar estrutura de dados para o repositório de arquivos

  1. Novas Tabelas
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key para auth.users)
    
    - `subgroups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `group_id` (uuid, foreign key para groups)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key para auth.users)
    
    - `files`
      - `id` (uuid, primary key)
      - `name` (text)
      - `link` (text)
      - `subgroup_id` (uuid, foreign key para subgroups)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key para auth.users)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para permitir que usuários:
      - Vejam apenas seus próprios dados
      - Criem novos registros
      - Atualizem seus próprios registros
      - Deletem seus próprios registros
*/

-- Criar tabela de grupos
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar tabela de subgrupos
CREATE TABLE IF NOT EXISTS subgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar tabela de arquivos
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  link text NOT NULL,
  subgroup_id uuid REFERENCES subgroups(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Habilitar RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Políticas para grupos
CREATE POLICY "Usuários podem ver seus próprios grupos"
  ON groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar grupos"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios grupos"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios grupos"
  ON groups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para subgrupos
CREATE POLICY "Usuários podem ver seus próprios subgrupos"
  ON subgroups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar subgrupos"
  ON subgroups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios subgrupos"
  ON subgroups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios subgrupos"
  ON subgroups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para arquivos
CREATE POLICY "Usuários podem ver seus próprios arquivos"
  ON files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar arquivos"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
  ON files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios arquivos"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);