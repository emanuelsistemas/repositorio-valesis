/*
  # Setup database schema and security policies

  1. Tables
    - groups
    - subgroups
    - files

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subgroups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  link text NOT NULL,
  subgroup_id uuid NOT NULL REFERENCES subgroups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Groups policies
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios grupos" ON groups;
  DROP POLICY IF EXISTS "Usuários podem criar grupos" ON groups;
  DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios grupos" ON groups;
  DROP POLICY IF EXISTS "Usuários podem deletar seus próprios grupos" ON groups;
  
  -- Subgroups policies
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios subgrupos" ON subgroups;
  DROP POLICY IF EXISTS "Usuários podem criar subgrupos" ON subgroups;
  DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios subgrupos" ON subgroups;
  DROP POLICY IF EXISTS "Usuários podem deletar seus próprios subgrupos" ON subgroups;
  
  -- Files policies
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios arquivos" ON files;
  DROP POLICY IF EXISTS "Usuários podem criar arquivos" ON files;
  DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios arquivos" ON files;
  DROP POLICY IF EXISTS "Usuários podem deletar seus próprios arquivos" ON files;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies for groups
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

-- Create policies for subgroups
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

-- Create policies for files
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