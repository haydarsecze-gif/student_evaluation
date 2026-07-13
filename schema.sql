-- Recreate database tables for the linked Classes, Subjects, and Lecturers schema
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS lecturers CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS custom_questions CASCADE;

-- 1. Create Lecturers Table
CREATE TABLE lecturers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 2. Create Subjects Table (Module Catalog: Module Code, Module Name, Semester, Program)
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester INTEGER NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('foundation', 'degree'))
);

-- 3. Create Classes Table (Linked directly to a Subject/Module and multiple Lecturers, including manual Intake Year and Month)
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL, -- e.g. "S2A"
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  lecturer_ids UUID[] NOT NULL DEFAULT '{}',
  year INTEGER NOT NULL, -- Intake Year (e.g. 2026)
  month TEXT NOT NULL, -- Intake Month (e.g. "July")
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
  lecturer TEXT NOT NULL, -- Specific lecturer evaluated
  class_code TEXT, -- Specific class section code evaluated (e.g. "S2A")
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

-- Seed Lecturers
INSERT INTO lecturers (id, name)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Dr. Evelyn Martinez'),
  ('d2222222-2222-2222-2222-222222222222', 'Prof. Alan Turing'),
  ('d3333333-3333-3333-3333-333333333333', 'Prof. Marcus Vance'),
  ('d4444444-4444-4444-4444-444444444444', 'Dr. Sarah Jenkins')
ON CONFLICT (id) DO NOTHING;

-- Seed Subjects (Module Catalog with program types seeded)
INSERT INTO subjects (id, name, code, semester, program)
VALUES
  ('a1a1a1a1-1111-1111-1111-111111111111', 'Introduction to Programming', 'PROG101', 1, 'degree'),
  ('a2a2a2a2-2222-2222-2222-222222222222', 'Discrete Mathematics', 'MATH105', 1, 'degree'),
  ('a3a3a3a3-3333-3333-3333-333333333333', 'Data Structures & Algorithms', 'DSA201', 3, 'degree'),
  ('b4b4b4b4-4444-4444-4444-444411111111', 'Object-Oriented Programming', 'OOP102', 2, 'degree'),
  ('b5b5b5b5-5555-5555-5555-555511111111', 'Database Systems', 'DB202', 2, 'degree')
ON CONFLICT (id) DO NOTHING;

-- Seed Classes (Each class represents a cohort taking a subject, with multiple lecturers assigned, no separate name column)
INSERT INTO classes (id, code, subject_id, lecturer_ids, year, month, semester)
VALUES
  ('c1c1c1c1-1111-1111-1111-111111111111', 'S1A', 'a1a1a1a1-1111-1111-1111-111111111111', ARRAY['d1111111-1111-1111-1111-111111111111']::UUID[], 2026, 'July', 1),
  ('c2c2c2c2-2222-2222-2222-222222222222', 'S1B', 'a1a1a1a1-1111-1111-1111-111111111111', ARRAY['d2222222-2222-2222-2222-222222222222']::UUID[], 2026, 'July', 1),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'S2A', 'b4b4b4b4-4444-4444-4444-444411111111', ARRAY['d3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444']::UUID[], 2026, 'July', 2),
  ('c4c4c4c4-4444-4444-4444-444444444444', 'S2B', 'b4b4b4b4-4444-4444-4444-444411111111', ARRAY['d4444444-4444-4444-4444-444444444444']::UUID[], 2026, 'July', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Custom Questions (Student Appraisal Form Questions with Section Headers and [row] markers)
INSERT INTO custom_questions (id, label, type, options, required)
VALUES
  ('e0000001-1111-1111-1111-111111111111', '1. The lecturer is in class on time. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000002-1111-1111-1111-111111111111', '2. The lecturer treats the students with respect. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000003-1111-1111-1111-111111111111', '3. The lecturer show positive attitude about the university. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000004-1111-1111-1111-111111111111', '[Section: Class Preparation] 4. The lecturer is prepared and organised for each class session. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000005-1111-1111-1111-111111111111', '[Section: Class Preparation] 5. Assignment grading and submission dates are clearly stated or posted. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000006-1111-1111-1111-111111111111', '[Section: Delivery & Class Conduct] 6. The assignments and classwork is challenging and make the students think. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000007-1111-1111-1111-111111111111', '[Section: Delivery & Class Conduct] 7. The lecturer''s language is clear and easy to understand. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000008-1111-1111-1111-111111111111', '[Section: Delivery & Class Conduct] 8. The lecturer encourages student''s participation in class and independent thinking. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000009-1111-1111-1111-111111111111', '[Section: Delivery & Class Conduct] 9. The lecturer uses useful teaching aids (for example: images, videos, interactive assignments and activities). [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000010-1111-1111-1111-111111111111', '[Section: Support & Assistance] 10. The lecturer is concerned with whether or not students learn/understand the material/topic. [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000011-1111-1111-1111-111111111111', '[Section: Support & Assistance] 11. The lecturer is available outside of class to help students (for example: by e-mail, social media, phone, appointments). [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000012-1111-1111-1111-111111111111', '[Section: Feedback & Work Evaluation] 12. The lecturer provides useful feedback regarding the students performance. [row]', 'radio', ARRAY['1', '2', '3', '4', '5'], true),
  ('e0000013-1111-1111-1111-111111111111', '[Section: Overall] 13. Overall how would you grade your lecturer? [row]', 'radio', ARRAY['1 (Strongly Disagree)', '2', '3', '4', '5 (Strongly Agree)'], true),
  ('e0000014-1111-1111-1111-111111111111', '[Section: Overall] Please provide additional comments or feedback. (Feel free to share both positive and negative opinions related to your lecturer)', 'long', ARRAY[]::TEXT[], true)
ON CONFLICT (id) DO NOTHING;

-- Seed Submissions (reset to empty custom answers to match new questionnaire)
INSERT INTO submissions (name, email, phone, program, semester, class_id, subject_id, score, lecturer, custom_answers)
VALUES
  ('John Doe', 'john.doe@university.edu', '555-0199', 'degree', 1, 'c1c1c1c1-1111-1111-1111-111111111111', 'a1a1a1a1-1111-1111-1111-111111111111', 85, 'Dr. Evelyn Martinez', '{}'::JSONB),
  ('Alice Smith', 'alice.smith@university.edu', '555-0188', 'degree', 2, 'c4c4c4c4-4444-4444-4444-444444444444', 'b4b4b4b4-4444-4444-4444-444411111111', 92, 'Dr. Sarah Jenkins', '{}'::JSONB)
ON CONFLICT DO NOTHING;

-- Disable Row Level Security (RLS) on all tables to allow public anonymous API access
ALTER TABLE lecturers DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Setup explicit permissive Policies just in case RLS gets active
DROP POLICY IF EXISTS "Public access" ON lecturers;
CREATE POLICY "Public access" ON lecturers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access" ON classes;
CREATE POLICY "Public access" ON classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access" ON subjects;
CREATE POLICY "Public access" ON subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access" ON custom_questions;
CREATE POLICY "Public access" ON custom_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access" ON active_semesters;
CREATE POLICY "Public access" ON active_semesters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access" ON settings;
CREATE POLICY "Public access" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access" ON submissions;
CREATE POLICY "Public access" ON submissions FOR ALL USING (true) WITH CHECK (true);

-- Grant API permissions to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE lecturers TO anon, authenticated, service_role;
GRANT ALL ON TABLE classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE subjects TO anon, authenticated, service_role;
GRANT ALL ON TABLE custom_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE active_semesters TO anon, authenticated, service_role;
GRANT ALL ON TABLE settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE submissions TO anon, authenticated, service_role;
