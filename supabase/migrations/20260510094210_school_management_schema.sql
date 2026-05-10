/*
  # School Class Management System - Initial Schema

  ## Tables
  - `users` - All users with role (admin, guru, siswa)
  - `guru` - Teacher profiles linked to users
  - `siswa` - Student profiles linked to users
  - `kelas` - Class data
  - `mapel` - Subject (mata pelajaran) data
  - `kelas_siswa` - Many-to-many: students enrolled in classes
  - `guru_mapel_kelas` - Teacher assigned to teach a subject in a class
  - `nilai` - Student grades per subject per class

  ## Security
  - RLS enabled on all tables
  - Policies based on role stored in users table
*/

-- Users table (all roles)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nama text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Guru table
CREATE TABLE IF NOT EXISTS guru (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nip text UNIQUE,
  nama text NOT NULL,
  email text,
  telepon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guru ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read guru"
  ON guru FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert guru"
  ON guru FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can update guru"
  ON guru FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete guru"
  ON guru FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Siswa table
CREATE TABLE IF NOT EXISTS siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nis text UNIQUE,
  nama text NOT NULL,
  email text,
  telepon text,
  jenis_kelamin text CHECK (jenis_kelamin IN ('L', 'P')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read siswa"
  ON siswa FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert siswa"
  ON siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can update siswa"
  ON siswa FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete siswa"
  ON siswa FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Kelas table
CREATE TABLE IF NOT EXISTS kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas text NOT NULL,
  tingkat text NOT NULL,
  jurusan text,
  tahun_ajaran text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read kelas"
  ON kelas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert kelas"
  ON kelas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can update kelas"
  ON kelas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete kelas"
  ON kelas FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Mapel (Mata Pelajaran) table
CREATE TABLE IF NOT EXISTS mapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_mapel text UNIQUE NOT NULL,
  nama_mapel text NOT NULL,
  deskripsi text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mapel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read mapel"
  ON mapel FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert mapel"
  ON mapel FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can update mapel"
  ON mapel FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete mapel"
  ON mapel FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Kelas Siswa (enrollment)
CREATE TABLE IF NOT EXISTS kelas_siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES kelas(id) ON DELETE CASCADE,
  siswa_id uuid REFERENCES siswa(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(kelas_id, siswa_id)
);

ALTER TABLE kelas_siswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read kelas_siswa"
  ON kelas_siswa FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert kelas_siswa"
  ON kelas_siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete kelas_siswa"
  ON kelas_siswa FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Guru Mapel Kelas (teacher assignment)
CREATE TABLE IF NOT EXISTS guru_mapel_kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid REFERENCES guru(id) ON DELETE CASCADE,
  mapel_id uuid REFERENCES mapel(id) ON DELETE CASCADE,
  kelas_id uuid REFERENCES kelas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guru_id, mapel_id, kelas_id)
);

ALTER TABLE guru_mapel_kelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read guru_mapel_kelas"
  ON guru_mapel_kelas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert guru_mapel_kelas"
  ON guru_mapel_kelas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete guru_mapel_kelas"
  ON guru_mapel_kelas FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Nilai (Grades)
CREATE TABLE IF NOT EXISTS nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid REFERENCES siswa(id) ON DELETE CASCADE,
  mapel_id uuid REFERENCES mapel(id) ON DELETE CASCADE,
  kelas_id uuid REFERENCES kelas(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES guru(id) ON DELETE SET NULL,
  nilai_tugas numeric(5,2) DEFAULT 0,
  nilai_uts numeric(5,2) DEFAULT 0,
  nilai_uas numeric(5,2) DEFAULT 0,
  nilai_akhir numeric(5,2) GENERATED ALWAYS AS (
    ROUND((nilai_tugas * 0.4 + nilai_uts * 0.3 + nilai_uas * 0.3)::numeric, 2)
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(siswa_id, mapel_id, kelas_id)
);

ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read nilai"
  ON nilai FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Guru can insert nilai"
  ON nilai FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'guru'))
  );

CREATE POLICY "Guru can update nilai"
  ON nilai FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'guru'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'guru'))
  );

CREATE POLICY "Guru can delete nilai"
  ON nilai FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'guru'))
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nilai_updated_at
  BEFORE UPDATE ON nilai
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed admin user (password: admin123 - using a simple hash approach via app-level)
-- We'll use Supabase auth for the actual login, but we store role info in users table
-- For demo: insert default admin
INSERT INTO users (id, username, password_hash, nama, role)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin123',
  'Administrator',
  'admin'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, nama, role)
VALUES 
  ('guru1', 'guru123', 'Budi Santoso', 'guru'),
  ('guru2', 'guru123', 'Siti Rahayu', 'guru'),
  ('siswa1', 'siswa123', 'Ahmad Fauzi', 'siswa'),
  ('siswa2', 'siswa123', 'Dewi Lestari', 'siswa'),
  ('siswa3', 'siswa123', 'Rizky Pratama', 'siswa')
ON CONFLICT (username) DO NOTHING;

-- Seed demo data
INSERT INTO guru (user_id, nip, nama, email, telepon)
SELECT u.id, '198501012010011001', 'Budi Santoso', 'budi@sekolah.id', '081234567890'
FROM users u WHERE u.username = 'guru1'
ON CONFLICT (nip) DO NOTHING;

INSERT INTO guru (user_id, nip, nama, email, telepon)
SELECT u.id, '199003152015012002', 'Siti Rahayu', 'siti@sekolah.id', '087654321098'
FROM users u WHERE u.username = 'guru2'
ON CONFLICT (nip) DO NOTHING;

INSERT INTO siswa (user_id, nis, nama, email, jenis_kelamin)
SELECT u.id, '2024001', 'Ahmad Fauzi', 'ahmad@siswa.id', 'L'
FROM users u WHERE u.username = 'siswa1'
ON CONFLICT (nis) DO NOTHING;

INSERT INTO siswa (user_id, nis, nama, email, jenis_kelamin)
SELECT u.id, '2024002', 'Dewi Lestari', 'dewi@siswa.id', 'P'
FROM users u WHERE u.username = 'siswa2'
ON CONFLICT (nis) DO NOTHING;

INSERT INTO siswa (user_id, nis, nama, email, jenis_kelamin)
SELECT u.id, '2024003', 'Rizky Pratama', 'rizky@siswa.id', 'L'
FROM users u WHERE u.username = 'siswa3'
ON CONFLICT (nis) DO NOTHING;

INSERT INTO kelas (nama_kelas, tingkat, jurusan, tahun_ajaran)
VALUES 
  ('X IPA 1', 'X', 'IPA', '2024/2025'),
  ('XI IPS 2', 'XI', 'IPS', '2024/2025'),
  ('XII RPL 1', 'XII', 'RPL', '2024/2025')
ON CONFLICT DO NOTHING;

INSERT INTO mapel (kode_mapel, nama_mapel, deskripsi)
VALUES
  ('MTK', 'Matematika', 'Mata pelajaran matematika'),
  ('ING', 'Bahasa Inggris', 'Mata pelajaran bahasa inggris'),
  ('FIS', 'Fisika', 'Mata pelajaran fisika'),
  ('KIM', 'Kimia', 'Mata pelajaran kimia'),
  ('BIO', 'Biologi', 'Mata pelajaran biologi')
ON CONFLICT (kode_mapel) DO NOTHING;
