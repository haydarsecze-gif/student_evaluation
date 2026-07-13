-- Recreate database tables safely (non-destructively)

-- 1. Create Lecturers Table
CREATE TABLE IF NOT EXISTS lecturers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 2. Create Subjects Table (Module Catalog: Module Code, Module Name, Semester, Program)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester INTEGER NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('foundation', 'degree'))
);

-- 3. Create Classes Table (Linked directly to a Subject/Module and multiple Lecturers, including manual Intake Year and Month)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  lecturer_ids UUID[] NOT NULL DEFAULT '{}',
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
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
