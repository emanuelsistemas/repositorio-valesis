/*
  # Create default user

  1. Changes
    - Create default user account with specified credentials
    - Use proper error handling for existing users
*/

-- Function to create the default user
CREATE OR REPLACE FUNCTION create_default_user()
RETURNS void AS $$
DECLARE
  default_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO default_user_id
  FROM auth.users
  WHERE email = 'drive@mail.com';

  -- Only create if user doesn't exist
  IF default_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'drive@mail.com',
      crypt('949207400', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_default_user();