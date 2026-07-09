-- Supabase Database Schema Script
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/xaqqzuvlpymqofyonave/sql/new)

-- 1. Create Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  lecturer TEXT NOT NULL
);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('early', 'end', 'both'))
);

-- 3. Create Lecturer Assignments Table
CREATE TABLE IF NOT EXISTS lecturer_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE
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

-- 6. Create Settings Table (for Form Active toggle)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 7. Create Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
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
-- SEED INITIAL DATA (Hex-valid UUIDs only)
-- ==========================================

-- Seed Settings
INSERT INTO settings (key, value)
VALUES ('formActive', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Active Semesters
INSERT INTO active_semesters (program, semesters)
VALUES 
  ('foundation', ARRAY[1, 2]),
  ('degree', ARRAY[1, 2, 3, 4, 5, 6])
ON CONFLICT (program) DO NOTHING;

-- Seed Classes (c is valid hex)
INSERT INTO classes (id, name, code, lecturer)
VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'Computer Science A', 'CS101', 'Dr. Evelyn Martinez'),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'Software Engineering B', 'SE302', 'Prof. Marcus Vance'),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'Data Science C', 'DS201', 'Dr. Sarah Jenkins')
ON CONFLICT (id) DO NOTHING;

-- Seed Subjects (a and b are valid hex)
INSERT INTO subjects (id, name, code, type)
VALUES
  ('a1a1a1a1-1111-1111-1111-111111111111', 'Introduction to Programming', 'PROG101', 'early'),
  ('a2a2a2a2-2222-2222-2222-222222222222', 'Discrete Mathematics', 'MATH105', 'early'),
  ('a3a3a3a3-3333-3333-3333-333333333333', 'Data Structures & Algorithms', 'DSA201', 'early'),
  ('b4b4b4b4-4444-4444-4444-444411111111', 'Object-Oriented Programming', 'OOP102', 'end'),
  ('b5b5b5b5-5555-5555-5555-555511111111', 'Database Systems', 'DB202', 'end'),
  ('b6b6b6b6-6666-6666-6666-666611111111', 'Web Application Development', 'WEB301', 'end'),
  ('b7b7b7b7-7777-7777-7777-777711111111', 'Academic Writing & Ethics', 'ETH401', 'both')
ON CONFLICT (id) DO NOTHING;

-- Seed Lecturer Assignments (f is valid hex)
INSERT INTO lecturer_assignments (id, lecturer_name, class_id, semester, subject_id)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Dr. Evelyn Martinez', 'c1c1c1c1-1111-1111-1111-111111111111', 1, 'a1a1a1a1-1111-1111-1111-111111111111'),
  ('f2222222-2222-2222-2222-222222222222', 'Dr. Evelyn Martinez', 'c1c1c1c1-1111-1111-1111-111111111111', 3, 'a3a3a3a3-3333-3333-3333-333333333333'),
  ('f3333333-3333-3333-3333-333333333333', 'Prof. Marcus Vance', 'c2c2c2c2-2222-2222-2222-222222222222', 2, 'b4b4b4b4-4444-4444-4444-444411111111'),
  ('f4444444-4444-4444-4444-444422222222', 'Prof. Marcus Vance', 'c2c2c2c2-2222-2222-2222-222222222222', 4, 'b5b5b5b5-5555-5555-5555-555511111111'),
  ('f5555555-5555-5555-5555-555533333333', 'Dr. Sarah Jenkins', 'c3c3c3c3-3333-3333-3333-333333333333', 5, 'a2a2a2a2-2222-2222-2222-222222222222'),
  ('f6666666-6666-6666-6666-666633333333', 'Dr. Evelyn Martinez', 'c1c1c1c1-1111-1111-1111-111111111111', 1, 'b7b7b7b7-7777-7777-7777-777711111111'),
  ('f7777777-7777-7777-7777-777733333333', 'Prof. Alan Turing', 'c1c1c1c1-1111-1111-1111-111111111111', 1, 'b7b7b7b7-7777-7777-7777-777711111111'),
  ('l8888888-8888-8888-8888-888833333333', 'Prof. Marcus Vance', 'c2c2c2c2-2222-2222-2222-222222222222', 2, 'b7b7b7b7-7777-7777-7777-777711111111'),
  ('l9999999-9999-9999-9999-999933333333', 'Dr. Grace Hopper', 'c2c2c2c2-2222-2222-2222-222222222222', 2, 'b7b7b7b7-7777-7777-7777-777711111111')
ON CONFLICT (id) DO NOTHING;

-- Seed Custom Questions (e is valid hex)
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
  ('Alice Smith', 'alice.smith@university.edu', '555-0188', 'degree', 3, 'c1c1c1c1-1111-1111-1111-111111111111', 'a3a3a3a3-3333-3333-3333-333333333333', 92, 'Dr. Evelyn Martinez', '{"e1e1e1e1-1111-1111-1111-111111111111": "Yes, extensively", "e2e2e2e2-2222-2222-2222-222222222222": ["Official Documentation", "Practical Lab Sheets"], "e3e3e3e3-3333-3333-3333-333333333333": "Ace the dynamic coding problems."}'::JSONB),
  ('Bob Johnson', 'bob.johnson@university.edu', '555-0177', 'foundation', 2, 'c2c2c2c2-2222-2222-2222-222222222222', 'b4b4b4b4-4444-4444-4444-444411111111', 78, 'Prof. Marcus Vance', '{"e1e1e1e1-1111-1111-1111-111111111111": "No experience", "e2e2e2e2-2222-2222-2222-222222222222": ["Video Tutorials"], "e3e3e3e3-3333-3333-3333-333333333333": "Get comfortable writing OOP structures."}'::JSONB)
ON CONFLICT DO NOTHING;
