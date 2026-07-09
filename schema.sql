-- Recreate tables to apply the separate Classes and Subjects model
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS lecturer_assignments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- 1. Create Classes Table (Class Code and Class Name)
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL
);

-- 2. Create Subjects Table (Module Code and Subject Name)
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester INTEGER NOT NULL
);

-- 3. Create Lecturer Assignments Table (Maps lecturer, class, and subject)
CREATE TABLE lecturer_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL
);

-- 4. Create Custom Questions Table
CREATE TABLE IF NOT EXISTS custom_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('short', 'long', 'radio', 'checkbox')),
  options TEXT[] NOT NULL DEFAULT '{}',
  required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Active Semesters Table
CREATE TABLE IF NOT EXISTS active_semesters (
  program TEXT PRIMARY KEY CHECK (program IN ('foundation', 'degree')),
  semesters INTEGER[] NOT NULL
);

-- 6. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 7. Create Submissions Table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('foundation', 'degree')),
  semester INTEGER NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  lecturer TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  custom_answers JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ==========================================
-- SEED INITIAL DATA
-- ==========================================

-- Seed Settings
INSERT INTO settings (key, value)
VALUES 
  ('formActive', 'true'::jsonb),
  ('adminPassword', '"admin123"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Active Semesters
INSERT INTO active_semesters (program, semesters)
VALUES 
  ('foundation', ARRAY[1, 2]),
  ('degree', ARRAY[1, 2, 3, 4, 5, 6])
ON CONFLICT (program) DO NOTHING;

-- Seed Classes (Class Code can change depending on class opened)
INSERT INTO classes (id, name, code, year, semester)
VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Computer Science A', 'CS1A', 1, 1),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Software Engineering B', 'SE1B', 1, 2),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Data Science C', 'DS2C', 2, 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Subjects (Module Code changes once in a while)
INSERT INTO subjects (id, name, code, semester)
VALUES
  ('a1a1a1a1-1111-1111-1111-111111111111', 'Introduction to Programming', 'PROG101', 1),
  ('a2a2a2a2-2222-2222-2222-222222222222', 'Discrete Mathematics', 'MATH105', 1),
  ('a3a3a3a3-3333-3333-3333-333333333333', 'Data Structures & Algorithms', 'DSA201', 3),
  ('b4b4b4b4-4444-4444-4444-444411111111', 'Object-Oriented Programming', 'OOP102', 2),
  ('b5b5b5b5-5555-5555-5555-555511111111', 'Database Systems', 'DB202', 2),
  ('b6b6b6b6-6666-6666-6666-666611111111', 'Web Application Development', 'WEB301', 3),
  ('b7b7b7b7-7777-7777-7777-777711111111', 'Academic Writing & Ethics', 'ETH401', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Lecturer Assignments
INSERT INTO lecturer_assignments (id, lecturer_name, class_id, subject_id, semester)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Dr. Evelyn Martinez', 'c1c1c1c1-1111-1111-1111-111111111111', 'a1a1a1a1-1111-1111-1111-111111111111', 1),
  ('f2222222-2222-2222-2222-222222222222', 'Dr. Evelyn Martinez', 'c1c1c1c1-1111-1111-1111-111111111111', 'b7b7b7b7-7777-7777-7777-777711111111', 1),
  ('f3333333-3333-3333-3333-333333333333', 'Prof. Alan Turing', 'c1c1c1c1-1111-1111-1111-111111111111', 'b7b7b7b7-7777-7777-7777-777711111111', 1),
  ('f4444444-4444-4444-4444-444422222222', 'Prof. Marcus Vance', 'c2c2c2c2-2222-2222-2222-222222222222', 'b4b4b4b4-4444-4444-4444-444411111111', 2),
  ('f5555555-5555-5555-5555-555533333333', 'Prof. Marcus Vance', 'c2c2c2c2-2222-2222-2222-222222222222', 'b5b5b5b5-5555-5555-5555-555511111111', 2),
  ('f6666666-6666-6666-6666-666633333333', 'Dr. Sarah Jenkins', 'c3c3c3c3-3333-3333-3333-333333333333', 'a3a3a3a3-3333-3333-3333-333333333333', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Submissions
INSERT INTO submissions (name, email, phone, program, semester, class_id, subject_id, score, lecturer, custom_answers)
VALUES
  ('John Doe', 'john.doe@university.edu', '555-0199', 'degree', 1, 'c1c1c1c1-1111-1111-1111-111111111111', 'a1a1a1a1-1111-1111-1111-111111111111', 85, 'Dr. Evelyn Martinez', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, a little", "e2e2e2e2-2222-2222-2222-222222222222": ["Video Tutorials", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Build solid logic foundations."}'::JSONB),
  ('Alice Smith', 'alice.smith@university.edu', '555-0188', 'degree', 3, 'c3c3c3c3-3333-3333-3333-333333333333', 'a3a3a3a3-3333-3333-3333-333333333333', 92, 'Dr. Sarah Jenkins', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, extensively", "e2e2e2e2-2222-2222-2222-222222222222": ["Official Documentation", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Ace the dynamic coding problems."}'::JSONB),
  ('Bob Johnson', 'bob.johnson@university.edu', '555-0177', 'foundation', 2, 'c2c2c2c2-2222-2222-2222-222222222222', 'b4b4b4b4-4444-4444-4444-444411111111', 78, 'Prof. Marcus Vance', '{"e1e1e1e1-1111-1111-1111-111111111111": "No experience", "e2e2e2e2-2222-2222-2222-222222222222": ["Video Tutorials"], "e3e3e3e3-3333-3333-3333-333333333333": "Get comfortable writing OOP structures."}'::JSONB)
ON CONFLICT DO NOTHING;

-- Disable Row Level Security (RLS) on all tables to allow public anonymous API access
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecturer_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Grant API permissions to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE subjects TO anon, authenticated, service_role;
GRANT ALL ON TABLE lecturer_assignments TO anon, authenticated, service_role;
GRANT ALL ON TABLE custom_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE active_semesters TO anon, authenticated, service_role;
GRANT ALL ON TABLE settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE submissions TO anon, authenticated, service_role;
