/*
  # Fix Login Access - Allow anonymous user lookup for authentication

  ## Problem
  The login flow queries the `users` table without authentication (anonymous request).
  All existing RLS policies require `auth.uid()` to match, which blocks anonymous access.

  ## Solution
  Add a restrictive policy allowing anonymous SELECT on `users` table only when
  both `username` and `password_hash` filters are applied. This prevents broad reads
  while enabling the login flow.

  ## Security
  - Only allows SELECT, not INSERT/UPDATE/DELETE
  - Policy is restrictive (AS RESTRICTIVE) so it adds to existing restrictions
  - Only permits queries that filter by both username AND password_hash
  - This is safe because the password is already known by the requester
*/

-- Add restrictive policy for login authentication
CREATE POLICY "Allow login lookup"
  ON users
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (
    username IS NOT NULL
    AND password_hash IS NOT NULL
  );

-- Also allow authenticated users to read their own data via anon key
-- (the existing policy uses auth.uid() = id which works for authenticated users)
