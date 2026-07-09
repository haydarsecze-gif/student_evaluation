-- Recreate tables to apply the new combined Classes & Subjects structure
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS lecturer_assignments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- 1. Create Classes Table (Each class represents a course/subject with a code, name, year, and semester)
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL
);

-- 2. Create Lecturer Assignments Table (Maps lecturers directly to classes)
CREATE TABLE lecturer_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL
);

-- 3. Create Custom Questions Table
CREATE TABLE IF NOT EXISTS custom_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('short', 'long', 'radio', 'checkbox')),
  options TEXT[] NOT NULL DEFAULT '{}',
  required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Active Semesters Table
CREATE TABLE IF NOT EXISTS active_semesters (
  program TEXT PRIMARY KEY CHECK (program IN ('foundation', 'degree')),
  semesters INTEGER[] NOT NULL
);

-- 5. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 6. Create Submissions Table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('foundation', 'degree')),
  semester INTEGER NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
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

-- Seed Classes (representing Class/Subject courses)
INSERT INTO classes (id, name, code, year, semester)
VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Discrete Mathematics', 'MATH105', 1, 1),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Introduction to Programming', 'PROG101', 1, 1),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Object-Oriented Programming', 'OOP102', 1, 2),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Data Structures & Algorithms', 'DSA201', 2, 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Lecturer Assignments
INSERT INTO lecturer_assignments (id, lecturer_name, class_id, semester)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Dr. Evelyn Martinez', 'c1c1c1c1-1111-1111-1111-111111111111', 1),
  ('f2222222-2222-2222-2222-222222222222', 'Prof. Alan Turing', 'c1c1c1c1-1111-1111-1111-111111111111', 1),
  ('f3333333-3333-3333-3333-333333333333', 'Dr. Evelyn Martinez', 'c2c2c2c2-2222-2222-2222-222222222222', 1),
  ('f4444444-4444-4444-4444-444422222222', 'Prof. Marcus Vance', 'c3c3c3c3-3333-3333-3333-333333333333', 2),
  ('f5555555-5555-5555-5555-555533333333', 'Dr. Sarah Jenkins', 'c4c4c4c4-4444-4444-4444-444444444444', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Custom Questions
INSERT INTO custom_questions (id, label, type, options, required)
VALUES
  ('e1e1e1e1-1111-1111-1111-111111111111', 'Do you have previous programming experience?', 'radio', ARRAY['Yes, extensively', 'Yes, a little', 'No experience'], true),
  ('e2e2e2e2-2222-2222-2222-222222222222', 'Preferred study resources (Select all that apply)', 'checkbox', ARRAY['Video Tutorials', 'Official Documentation', 'Practical Lab Sheets', 'Peer Discussion'], false),
  ('e3e3e3e3-3333-3333-3333-333333333333', 'Briefly state your learning goals for this semester:', 'long', ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

-- Seed Submissions
INSERT INTO submissions (name, email, phone, program, semester, class_id, score, lecturer, custom_answers)
VALUES
  ('John Doe', 'john.doe@university.edu', '555-0199', 'degree', 1, 'c2c2c2c2-2222-2222-2222-222222222222', 85, 'Dr. Evelyn Martinez', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, a little", "e2e2e2e2-2222-2222-2222-222222222222": ["Video Tutorials", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Build solid logic foundations."}'::JSONB),
  ('Alice Smith', 'alice.smith@university.edu', '555-0188', 'degree', 3, 'c4c4c4c4-4444-4444-4444-444444444444', 92, 'Dr. Sarah Jenkins', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, extensively", "e2e2e2e2-2222-2222-2222-222222222222": ["Official Documentation", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Ace the dynamic coding problems."}'::JSONB),
  ('Bob Johnson', 'bob.johnson@university.edu', '555-0177', 'foundation', 2, 'c3c3c3c3-3333-3333-3333-333333333333', 78, 'Prof. Marcus Vance', '{"e1e1e1e1-1111-1111-1111-111111111111": "No experience", "e2e2e2e2-2222-2222-2222-222222222222": ["Video Tutorials"], "e3e3e3e3-3333-3333-3333-333333333333": "Get comfortable writing OOP structures."}'::JSONB)
ON CONFLICT DO NOTHING;

-- Disable Row Level Security (RLS) on all tables to allow public anonymous API access
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
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
GRANT ALL ON TABLE lecturer_assignments TO anon, authenticated, service_role;
GRANT ALL ON TABLE custom_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE active_semesters TO anon, authenticated, service_role;
GRANT ALL ON TABLE settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE submissions TO anon, authenticated, service_role;
