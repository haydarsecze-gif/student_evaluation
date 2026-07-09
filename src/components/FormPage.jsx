import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ShieldAlert, CheckCircle2, User, Mail, Phone, Calendar, BookOpen, GraduationCap, FileText, AlertCircle } from 'lucide-react';

export default function FormPage() {
  const {
    formActive,
    classes,
    getSubjectsBySemester,
    getLecturersForConfig,
    customQuestions,
    activeSemesters,
    addSubmission
  } = useAppState();

  // Basic Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState(''); // 'foundation' | 'degree'
  const [semester, setSemester] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [score, setScore] = useState(80);
  const [lecturer, setLecturer] = useState('');

  // Custom Questions Answers State
  const [customAnswers, setCustomAnswers] = useState({});

  // UI Flow States
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Available Lecturers filtered by Class + Semester + Subject
  const [availableLecturers, setAvailableLecturers] = useState([]);

  // Filter lecturers when class, semester, or subject changes
  useEffect(() => {
    if (classId && semester && subjectId) {
      const lecturers = getLecturersForConfig(classId, semester, subjectId);
      setAvailableLecturers(lecturers);
      // Auto-select if there is exactly 1 lecturer
      if (lecturers.length === 1) {
        setLecturer(lecturers[0].lecturerName);
      } else {
        setLecturer('');
      }
    } else {
      setAvailableLecturers([]);
      setLecturer('');
    }
  }, [classId, semester, subjectId, getLecturersForConfig]);

  // Reset semester/subject when program changes
  useEffect(() => {
    setSemester('');
    setSubjectId('');
  }, [program]);

  // Reset subject when semester changes
  useEffect(() => {
    setSubjectId('');
  }, [semester]);

  // Get subjects matching early/end cycle
  const availableSubjects = getSubjectsBySemester(semester);

  // Filter semesters based on program selection and active configurations
  const getVisibleSemesters = () => {
    if (!program) return [];
    const maxSem = program === 'foundation' ? 2 : 6;
    const activeList = activeSemesters[program] || [];
    
    // Generate array [1..maxSem] and filter by activeList
    return Array.from({ length: maxSem }, (_, i) => i + 1)
      .filter(sem => activeList.includes(sem));
  };

  // Grade helper
  const getGrade = (numScore) => {
    if (numScore >= 85) return { letter: 'A', class: 'badge-success' };
    if (numScore >= 70) return { letter: 'B', class: 'badge-info' };
    if (numScore >= 55) return { letter: 'C', class: 'badge-warning' };
    if (numScore >= 40) return { letter: 'D', class: 'badge-warning' };
    return { letter: 'F', class: 'badge-danger' };
  };

  // Handle custom question answer updates
  const handleCustomChange = (qId, value, isCheckbox = false) => {
    setCustomAnswers(prev => {
      const current = prev[qId];
      if (isCheckbox) {
        // If current is array, toggle. If not, start array.
        const currentArr = Array.isArray(current) ? current : [];
        const nextArr = currentArr.includes(value)
          ? currentArr.filter(v => v !== value)
          : [...currentArr, value];
        return { ...prev, [qId]: nextArr };
      } else {
        return { ...prev, [qId]: value };
      }
    });
  };

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Full Name is required';
    
    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (!/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(phone)) {
      tempErrors.phone = 'Please enter a valid phone number';
    }

    if (!program) tempErrors.program = 'Please select a program';
    if (!semester) tempErrors.semester = 'Please select a semester';
    if (!classId) tempErrors.classId = 'Please select a class';
    if (!subjectId) tempErrors.subjectId = 'Please select a subject';

    if (classId && semester && subjectId) {
      if (availableLecturers.length === 0) {
        tempErrors.lecturer = 'No lecturers assigned for this configuration (Admin setup required)';
      } else if (!lecturer) {
        tempErrors.lecturer = 'Please select a lecturer';
      }
    }

    // Validate Dynamic Custom Questions
    customQuestions.forEach(q => {
      const val = customAnswers[q.id];
      if (q.required) {
        if (q.type === 'checkbox') {
          if (!val || !Array.isArray(val) || val.length === 0) {
            tempErrors[q.id] = `${q.label} is required (select at least one option)`;
          }
        } else {
          if (!val || (typeof val === 'string' && !val.trim())) {
            tempErrors[q.id] = `${q.label} is required`;
          }
        }
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Add submission with basic fields + custom answers
    addSubmission({
      name,
      email,
      phone,
      program,
      semester: parseInt(semester, 10),
      classId,
      subjectId,
      score: parseInt(score, 10),
      lecturer,
      customAnswers
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setProgram('');
    setSemester('');
    setClassId('');
    setSubjectId('');
    setScore(80);
    setLecturer('');
    setCustomAnswers({});
    setErrors({});

    // Success banner
    setShowSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setShowSuccess(false);
    }, 4500);
  };

  if (!formActive) {
    return (
      <div className="form-closed-container glass-panel animate-fade-in">
        <div className="form-closed-icon">
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '0.75rem' }}>
          Form Submissions Closed
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          The administrator has temporarily disabled the student evaluation intake form. 
          Please contact the administrator or check back later.
        </p>
      </div>
    );
  }

  const grade = getGrade(score);
  const visibleSemesters = getVisibleSemesters();

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '2rem auto', width: '100%' }}>
      
      {/* Success Notification */}
      {showSuccess && (
        <div className="glass-panel animate-fade-in" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--success)',
          background: 'rgba(16, 185, 129, 0.08)'
        }}>
          <CheckCircle2 color="var(--success)" size={24} />
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Registration Complete!</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              The student performance record and custom responses have been registered.
            </p>
          </div>
        </div>
      )}

      {/* Student Form Box */}
      <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h2 className="title-gradient" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Student Evaluation Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Provide student details, complete academic placement, and fill custom questionnaire.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          
          {/* Section 1: Personal Info */}
          <div style={{
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary)" />
              Personal Information
            </h3>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. Bruce Wayne"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <span className="form-input-error-msg">{errors.name}</span>}
            </div>

            {/* Email & Phone */}
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="e.g. bruce@wayne.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <span className="form-input-error-msg">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="e.g. 555-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && <span className="form-input-error-msg">{errors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program & Semester Selection */}
          <div style={{
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} color="var(--primary)" />
              Academic Alignment
            </h3>

            {/* Program Selection */}
            <div className="form-group">
              <label className="form-label">
                Program / Course Type <span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  className={`form-input ${errors.program ? 'error' : ''}`}
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                >
                  <option value="">Select Program</option>
                  <option value="foundation">Foundation (2 Semesters)</option>
                  <option value="degree">Degree (6 Semesters)</option>
                </select>
              </div>
              {errors.program && <span className="form-input-error-msg">{errors.program}</span>}
            </div>

            {/* Semester & Class */}
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">
                  Semester <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    disabled={!program}
                    className={`form-input ${errors.semester ? 'error' : ''}`}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    style={!program ? { cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' } : {}}
                  >
                    <option value="">
                      {!program ? 'Select Program first' : 'Select Semester'}
                    </option>
                    {visibleSemesters.map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.semester && <span className="form-input-error-msg">{errors.semester}</span>}
                {program && visibleSemesters.length === 0 && (
                  <span className="form-input-error-msg" style={{ color: 'var(--warning)' }}>
                    No active semesters configured by Admin for this program.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Class Name <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    className={`form-input ${errors.classId ? 'error' : ''}`}
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.classId && <span className="form-input-error-msg">{errors.classId}</span>}
              </div>
            </div>

            {/* Subject Select */}
            <div className="form-group">
              <label className="form-label">
                Subject <span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  disabled={!semester}
                  className={`form-input ${errors.subjectId ? 'error' : ''}`}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  style={!semester ? { cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' } : {}}
                >
                  <option value="">
                    {!semester ? 'Select Semester first' : 'Select Subject'}
                  </option>
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              {errors.subjectId && <span className="form-input-error-msg">{errors.subjectId}</span>}
              {semester && (
                <span className="form-input-hint" style={{ color: 'var(--secondary)' }}>
                  Showing foundation subjects corresponding to Semester {semester} cycle + Universals.
                </span>
              )}
            </div>

            {/* Smart Lecturer Dropdown */}
            <div className="form-group">
              <label className="form-label">
                Lecturer <span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  disabled={!classId || !semester || !subjectId}
                  className={`form-input ${errors.lecturer ? 'error' : ''}`}
                  value={lecturer}
                  onChange={(e) => setLecturer(e.target.value)}
                  style={(!classId || !semester || !subjectId) ? { cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' } : {}}
                >
                  <option value="">
                    {(!classId || !semester || !subjectId) 
                      ? 'Complete Class, Semester, and Subject selections first' 
                      : availableLecturers.length === 0 
                        ? 'No Lecturers assigned' 
                        : 'Select Assigned Lecturer'}
                  </option>
                  {availableLecturers.map(la => (
                    <option key={la.id} value={la.lecturerName}>
                      {la.lecturerName}
                    </option>
                  ))}
                </select>
              </div>
              {errors.lecturer && <span className="form-input-error-msg">{errors.lecturer}</span>}
              {classId && semester && subjectId && availableLecturers.length === 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginTop: '0.25rem', color: '#fbbf24', fontSize: '0.75rem' }}>
                  <AlertCircle size={12} />
                  <span>Admin must create a Lecturer Assignment for this configuration.</span>
                </div>
              )}
            </div>

            {/* Performance (Slider) */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Performance / Score</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{score}</span>
                  <span className={`badge ${grade.class}`} style={{ minWidth: '24px', textAlign: 'center' }}>{grade.letter}</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              />
            </div>
          </div>

          {/* Section 3: Dynamic Custom Google Form-Style Questions */}
          {customQuestions.length > 0 && (
            <div style={{
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} color="var(--primary)" />
                Additional Questionnaire
              </h3>

              {customQuestions.map(q => {
                const error = errors[q.id];
                const answerValue = customAnswers[q.id];

                return (
                  <div key={q.id} className="form-group" style={{ marginBottom: '1.75rem' }}>
                    <label className="form-label">
                      {q.label} {q.required && <span className="required">*</span>}
                    </label>

                    {/* RENDER: Short Answer */}
                    {q.type === 'short' && (
                      <input
                        type="text"
                        className={`form-input ${error ? 'error' : ''}`}
                        placeholder="Your answer"
                        value={answerValue || ''}
                        onChange={(e) => handleCustomChange(q.id, e.target.value)}
                      />
                    )}

                    {/* RENDER: Paragraph */}
                    {q.type === 'long' && (
                      <textarea
                        rows={3}
                        className={`form-input ${error ? 'error' : ''}`}
                        placeholder="Your answer"
                        value={answerValue || ''}
                        onChange={(e) => handleCustomChange(q.id, e.target.value)}
                        style={{ resize: 'vertical', minHeight: '80px' }}
                      />
                    )}

                    {/* RENDER: Multiple Choice (Radio) */}
                    {q.type === 'radio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {q.options.map((opt, idx) => (
                          <label key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                              type="radio"
                              name={`custom-radio-${q.id}`}
                              checked={answerValue === opt}
                              onChange={() => handleCustomChange(q.id, opt)}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* RENDER: Checkboxes */}
                    {q.type === 'checkbox' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {q.options.map((opt, idx) => {
                          const isChecked = Array.isArray(answerValue) && answerValue.includes(opt);
                          return (
                            <label key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCustomChange(q.id, opt, true)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {error && <span className="form-input-error-msg">{error}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem' }}>
            <FileText size={18} />
            Register Student Record
          </button>
        </form>
      </div>
    </div>
  );
}
