/*
  # Setup inicial do banco de dados
  
  1. Tabelas
    - groups
      - id (uuid, primary key)
      - name (text)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    
    - subgroups
      - id (uuid, primary key)
      - name (text)
      - group_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    
    - files
      - id (uuid, primary key)
      - name (text)
      - link (text)
      - subgroup_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - created_at (timestamp)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas no user_id
*/

DO $$ BEGIN
  -- Criar tabelas se não existirem
  CREATE TABLE IF NOT EXISTS groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS subgroups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    link text NOT NULL,
    subgroup_id uuid NOT NULL REFERENCES subgroups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
  );

  -- Habilitar RLS
  ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE files ENABLE ROW LEVEL SECURITY;

  -- Criar políticas para groups se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Usuários podem ver seus próprios grupos'
  ) THEN
    CREATE POLICY "Usuários podem ver seus próprios grupos" ON groups
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Usuários podem criar grupos'
  ) THEN
    CREATE POLICY "Usuários podem criar grupos" ON groups
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Usuários podem atualizar seus próprios grupos'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus próprios grupos" ON groups
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Usuários podem deletar seus próprios grupos'
  ) THEN
    CREATE POLICY "Usuários podem deletar seus próprios grupos" ON groups
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Criar políticas para subgroups se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subgroups' AND policyname = 'Usuários podem ver seus próprios subgrupos'
  ) THEN
    CREATE POLICY "Usuários podem ver seus próprios subgrupos" ON subgroups
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subgroups' AND policyname = 'Usuários podem criar subgrupos'
  ) THEN
    CREATE POLICY "Usuários podem criar subgrupos" ON subgroups
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subgroups' AND policyname = 'Usuários podem atualizar seus próprios subgrupos'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus próprios subgrupos" ON subgroups
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subgroups' AND policyname = 'Usuários podem deletar seus próprios subgrupos'
  ) THEN
    CREATE POLICY "Usuários podem deletar seus próprios subgrupos" ON subgroups
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Criar políticas para files se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Usuários podem ver seus próprios arquivos'
  ) THEN
    CREATE POLICY "Usuários podem ver seus próprios arquivos" ON files
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Usuários podem criar arquivos'
  ) THEN
    CREATE POLICY "Usuários podem criar arquivos" ON files
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Usuários podem atualizar seus próprios arquivos'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus próprios arquivos" ON files
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Usuários podem deletar seus próprios arquivos'
  ) THEN
    CREATE POLICY "Usuários podem deletar seus próprios arquivos" ON files
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;