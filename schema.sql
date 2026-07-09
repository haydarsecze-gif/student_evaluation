-- Recreate database tables for the linked Classes, Subjects, and Lecturers schema
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS lecturer_assignments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- 1. Create Subjects Table (Module Catalog: Module Code, Module Name, Semester)
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester INTEGER NOT NULL
);

-- 2. Create Classes Table (Linked directly to a Subject/Module and Lecturer)
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g. "Section A"
  code TEXT NOT NULL, -- e.g. "S2A"
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  lecturer_name TEXT NOT NULL,
  year INTEGER NOT NULL,
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

-- Seed Subjects (Module Catalog)
INSERT INTO subjects (id, name, code, semester)
VALUES
  ('a1a1a1a1-1111-1111-1111-111111111111', 'Introduction to Programming', 'PROG101', 1),
  ('a2a2a2a2-2222-2222-2222-222222222222', 'Discrete Mathematics', 'MATH105', 1),
  ('a3a3a3a3-3333-3333-3333-333333333333', 'Data Structures & Algorithms', 'DSA201', 3),
  ('b4b4b4b4-4444-4444-4444-444411111111', 'Object-Oriented Programming', 'OOP102', 2),
  ('b5b5b5b5-5555-5555-5555-555511111111', 'Database Systems', 'DB202', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Classes (Each class represents a cohort taking a subject, with lecturer assigned)
INSERT INTO classes (id, name, code, subject_id, lecturer_name, year, semester)
VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Section S1A', 'S1A', 'a1a1a1a1-1111-1111-1111-111111111111', 'Dr. Evelyn Martinez', 1, 1),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Section S1B', 'S1B', 'a1a1a1a1-1111-1111-1111-111111111111', 'Prof. Alan Turing', 1, 1),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Section S2A', 'S2A', 'b4b4b4b4-4444-4444-4444-444411111111', 'Prof. Marcus Vance', 1, 2),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'Section S2B', 'S2B', 'b4b4b4b4-4444-4444-4444-444411111111', 'Dr. Sarah Jenkins', 1, 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Custom Questions
INSERT INTO custom_questions (id, label, type, options, required)
VALUES
  ('e1e1e1e1-1111-1111-1111-111111111111', 'Do you have previous programming experience?', 'radio', ARRAY['Yes, extensively', 'Yes, a little', 'No experience'], true),
  ('e2e2e2e2-2222-2222-2222-222222222222', 'Preferred study resources (Select all that apply)', 'checkbox', ARRAY['Video Tutorials', 'Official Documentation', 'Practical Lab Sheets', 'Peer Discussion'], false),
  ('e3e3e3e3-3333-3333-3333-333333333333', 'Briefly state your learning goals for this semester:', 'long', ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

-- Seed Submissions
INSERT INTO submissions (name, email, phone, program, semester, class_id, subject_id, score, lecturer, custom_answers)
VALUES
  ('John Doe', 'john.doe@university.edu', '555-0199', 'degree', 1, 'c1c1c1c1-1111-1111-1111-111111111111', 'a1a1a1a1-1111-1111-1111-111111111111', 85, 'Dr. Evelyn Martinez', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, a little", "e2e2e2e2-2222-2222-2222-222222222222": ["Video Tutorials", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Build solid logic foundations."}'::JSONB),
  ('Alice Smith', 'alice.smith@university.edu', '555-0188', 'degree', 2, 'c4c4c4c4-4444-4444-4444-444444444444', 'b4b4b4b4-4444-4444-4444-444411111111', 92, 'Dr. Sarah Jenkins', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, extensively", "e2e2e2e2-2222-2222-2222-222222222222": ["Official Documentation", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Ace the dynamic coding problems."}'::JSONB)
ON CONFLICT DO NOTHING;

-- Disable Row Level Security (RLS) on all tables to allow public anonymous API access
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
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
GRANT ALL ON TABLE custom_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE active_semesters TO anon, authenticated, service_role;
GRANT ALL ON TABLE settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE submissions TO anon, authenticated, service_role;
