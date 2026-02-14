-- Create system user in auth.users for Fun Pay Treasurer
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
VALUES (
  'f0f0f0f0-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'treasurer@funplay.system',
  '$2a$10$placeholder_not_a_real_password_hash_00000000000000',
  now(),
  now(),
  now(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create Fun Pay Treasurer profile
INSERT INTO public.profiles (id, username, display_name, avatar_url)
VALUES (
  'f0f0f0f0-0000-0000-0000-000000000001',
  'fun_pay_treasurer',
  'Fun Pay Treasurer',
  '/images/camly-coin.png'
) ON CONFLICT (id) DO NOTHING;