import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';

export default function FormPage() {
  const { 
    formActive,
    classes,
    subjects,
    lecturers,
    addSubmission,
    customQuestions,
    activeSemesters
  } = useAppState();

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState(''); // 'foundation' | 'degree'
  const [semester, setSemester] = useState('');
  const [classId, setClassId] = useState('');
  const [score, setScore] = useState(80);

  // Custom Questions Answers State
  const [customAnswers, setCustomAnswers] = useState({});

  // UI Flow States
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset semester and class when program changes
  useEffect(() => {
    setSemester('');
    setClassId('');
  }, [program]);

  // Reset class when semester changes
  useEffect(() => {
    setClassId('');
  }, [semester]);

  // Filter classes matching the selected semester and program
  const availableClasses = classes.filter(c => {
    const isSemMatch = parseInt(c.semester, 10) === parseInt(semester, 10);
    const subjectObj = subjects.find(s => s.id === c.subjectId);
    const isProgramMatch = subjectObj ? subjectObj.program === program : false;
    return isSemMatch && isProgramMatch;
  });

  // Filter semesters based on program selection and active configurations
  const getVisibleSemesters = () => {
    if (!program) return [];
    const maxSem = program === 'foundation' ? 2 : 6;
    const activeList = activeSemesters[program] || [];
    
    // Generate array [1..maxSem] and filter by activeList
    return Array.from({ length: maxSem }, (_, i) => i + 1)
      .filter(sem => activeList.includes(sem));
  };

  // Sentiment helper
  const getGrade = (numScore) => {
    if (numScore >= 85) return { letter: 'Love', class: 'badge-success' };
    if (numScore >= 70) return { letter: 'Like', class: 'badge-info' };
    if (numScore >= 55) return { letter: 'Normal', class: 'badge-warning' };
    if (numScore >= 40) return { letter: 'Not Like', class: 'badge-warning' };
    return { letter: 'Hate', class: 'badge-danger' };
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
      tempErrors.email = 'Invalid email address';
    }

    if (!phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{6,20}$/.test(phone)) {
      tempErrors.phone = 'Invalid phone number format';
    }

    if (!program) tempErrors.program = 'Please select a program';
    if (!semester) tempErrors.semester = 'Please select a semester';
    if (!classId) tempErrors.classId = 'Please select your Class / Module section';

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

    // Find details about the selected class section
    const selectedClass = classes.find(c => c.id === classId);
    if (!selectedClass) return;

    // Retrieve names for all linked lecturers
    const classLecturers = (selectedClass.lecturerIds || [])
      .map(id => lecturers.find(l => l.id === id))
      .filter(Boolean);
    const lecturerName = classLecturers.length > 0
      ? classLecturers.map(l => l.name).join(', ')
      : 'Unknown Lecturer';

    // Add submission with basic fields + custom answers
    addSubmission({
      name,
      email,
      phone,
      program,
      semester: parseInt(semester, 10),
      classId,
      subjectId: selectedClass.subjectId,
      score: parseInt(score, 10),
      lecturer: lecturerName,
      customAnswers
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setProgram('');
    setSemester('');
    setClassId('');
    setScore(80);
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
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--success)',
          background: 'var(--success-glow)'
        }}>
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
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

            {/* Semester Selection */}
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

            {/* Combined Class Section Select */}
            <div className="form-group">
              <label className="form-label">
                Class Code &amp; Module Section <span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  disabled={!semester}
                  className={`form-input ${errors.classId ? 'error' : ''}`}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  style={!semester ? { cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' } : {}}
                >
                  <option value="">
                    {!semester ? 'Select Semester first' : 'Select Class / Module Section'}
                  </option>
                  {availableClasses.map(c => {
                    const subjectObj = subjects.find(s => s.id === c.subjectId);
                    
                    // Retrieve names for all linked lecturers
                    const classLecturers = (c.lecturerIds || [])
                      .map(id => lecturers.find(l => l.id === id))
                      .filter(Boolean);
                    const lecturerDisplay = classLecturers.length > 0
                      ? classLecturers.map(l => l.name).join(', ')
                      : 'Unknown Lecturer';

                    const subjectDisplay = subjectObj ? `${subjectObj.name} (${subjectObj.code})` : 'Unknown Module';
                    return (
                      <option key={c.id} value={c.id}>
                        {subjectDisplay} [Class: {c.code} - {c.month} {c.year}] - {lecturerDisplay}
                      </option>
                    );
                  })}
                </select>
              </div>
              {errors.classId && <span className="form-input-error-msg">{errors.classId}</span>}
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
                  background: 'rgba(0,0,0,0.06)',
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
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
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
                        placeholder="Provide your short answer..."
                        value={answerValue || ''}
                        onChange={(e) => handleCustomChange(q.id, e.target.value)}
                      />
                    )}

                    {/* RENDER: Long Answer */}
                    {q.type === 'long' && (
                      <textarea
                        className={`form-input ${error ? 'error' : ''}`}
                        rows="3"
                        placeholder="Provide your long answer/feedback..."
                        value={answerValue || ''}
                        onChange={(e) => handleCustomChange(q.id, e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    )}

                    {/* RENDER: Radio Buttons */}
                    {q.type === 'radio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                              type="radio"
                              name={`custom_${q.id}`}
                              checked={answerValue === opt}
                              onChange={() => handleCustomChange(q.id, opt)}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* RENDER: Checkboxes */}
                    {q.type === 'checkbox' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {q.options.map((opt, oIdx) => {
                          const isChecked = Array.isArray(answerValue) && answerValue.includes(opt);
                          return (
                            <label key={oIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCustomChange(q.id, opt, true)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
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

          {/* Form Actions */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
            Submit Evaluation
          </button>
        </form>
      </div>
    </div>
  );
}
