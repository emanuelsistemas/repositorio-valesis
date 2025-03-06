/*
  # Create users table and authentication setup

  1. Tables
    - users (auth.users)
      - id (uuid, primary key)
      - email (text)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable email authentication
    - Set up necessary triggers and functions
*/

-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  encrypted_password text,
  email_confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create the user_id reference type
CREATE TYPE auth.jwt_token AS (
  token text
);

-- Create the auth schema function to handle sign ups
CREATE OR REPLACE FUNCTION auth.sign_up(
  email text,
  password text
) RETURNS auth.jwt_token AS $$
DECLARE
  user_id uuid;
  token text;
BEGIN
  -- Insert the new user
  INSERT INTO auth.users (email, encrypted_password)
  VALUES (
    email,
    crypt(password, gen_salt('bf'))
  )
  RETURNING id INTO user_id;

  -- Generate the JWT token
  token := auth.sign(
    json_build_object(
      'role', 'authenticated',
      'user_id', user_id
    ),
    current_setting('app.jwt_secret')
  );

  RETURN (token)::auth.jwt_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the auth schema function to handle sign ins
CREATE OR REPLACE FUNCTION auth.sign_in(
  email text,
  password text
) RETURNS auth.jwt_token AS $$
DECLARE
  account auth.users;
  token text;
BEGIN
  SELECT a.* INTO account
  FROM auth.users AS a
  WHERE a.email = sign_in.email;

  IF account.encrypted_password = crypt(password, account.encrypted_password) THEN
    token := auth.sign(
      json_build_object(
        'role', 'authenticated',
        'user_id', account.id
      ),
      current_setting('app.jwt_secret')
    );
    RETURN (token)::auth.jwt_token;
  ELSE
    RAISE EXCEPTION 'invalid_password' USING HINT = 'Invalid password';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;