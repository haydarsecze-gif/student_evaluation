import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const {
    formActive,
    setFormActive,
    classes,
    addClass,
    updateClass,
    deleteClass,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    submissions,
    deleteSubmission,
    
    // Lecturers context
    lecturers,
    addLecturer,
    updateLecturer,
    deleteLecturer,
    ensureLecturerExists,

    customQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    
    activeSemesters,
    toggleSemesterActive,
    adminPassword,
    updateAdminPassword,

    // Dialog context
    showAlert,
    showConfirm
  } = useAppState();

  // Tab controller for Admin Console
  const [adminTab, setAdminTab] = useState('records'); // 'records' | 'classes' | 'formDesign'
  const [classesSubTab, setClassesSubTab] = useState('classesList'); // 'classesList' | 'subjectsList' | 'lecturersList'

  // Master Logs Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterProgram, setFilterProgram] = useState(''); // '' | 'foundation' | 'degree'
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Row expansion state for custom answers
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  // Forms states for Classes (Added Intake Year and Month)
  const [editingClass, setEditingClass] = useState(null);
  const [classSubjectId, setClassSubjectId] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassYear, setNewClassYear] = useState(new Date().getFullYear());
  const [newClassMonth, setNewClassMonth] = useState('July');
  const [newClassLecturer, setNewClassLecturer] = useState(''); // comma-separated input list

  // Form states for Subjects (Modules)
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubSemester, setNewSubSemester] = useState(1);
  const [newSubProgram, setNewSubProgram] = useState('degree'); // 'degree' | 'foundation'

  // Form states for Lecturers
  const [editingLecturer, setEditingLecturer] = useState(null);
  const [newLecturerName, setNewLecturerName] = useState('');

  // Custom Question Form state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qLabel, setQLabel] = useState('');
  const [qType, setQType] = useState('short'); // 'short' | 'long' | 'radio' | 'checkbox'
  const [qOptionsText, setQOptionsText] = useState(''); // Comma-separated options
  const [qRequired, setQRequired] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Error messaging
  const [crudError, setCrudError] = useState('');

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    await updateAdminPassword(newPassword.trim());
    setPasswordChangeSuccess(true);
    setNewPassword('');
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  // Sentiment rating helper
  const getGrade = (numScore) => {
    if (numScore >= 85) return { letter: 'Love', class: 'badge-success' };
    if (numScore >= 70) return { letter: 'Like', class: 'badge-info' };
    if (numScore >= 55) return { letter: 'Normal', class: 'badge-warning' };
    if (numScore >= 40) return { letter: 'Not Like', class: 'badge-warning' };
    return { letter: 'Hate', class: 'badge-danger' };
  };

  // Excel exporter with custom question columns (Filtered dynamically by active Semester, Program, Year, and Month UI filters)
  const handleExportExcel = () => {
    // Filter classes based on active UI filters (Semester, Program, Year, Month)
    const filteredClasses = classes.filter(c => {
      const matchesSemester = filterSemester ? c.semester === parseInt(filterSemester, 10) : true;
      const subjectObj = subjects.find(s => s.id === c.subjectId);
      const matchesProgram = filterProgram ? (subjectObj ? subjectObj.program === filterProgram : false) : true;
      const matchesYear = filterYear ? c.year === parseInt(filterYear, 10) : true;
      const matchesMonth = filterMonth ? c.month === filterMonth : true;
      return matchesSemester && matchesProgram && matchesYear && matchesMonth;
    });

    if (filteredClasses.length === 0) {
      showAlert("No classes match the current active filter settings.", "Export Error");
      return;
    }

    const wb = XLSX.utils.book_new();

    filteredClasses.forEach(cls => {
      const classSubm = submissions.filter(s => s.classId === cls.id);

      const excelData = classSubm.map(s => {
        const subjectObj = subjects.find(sub => sub.id === s.subjectId);
        
        // Base student rows (includes Intake Year and Month columns)
        const row = {
          "Student Name": s.name,
          "Email": s.email,
          "Phone": s.phone,
          "Program": s.program === 'foundation' ? 'Foundation' : 'Degree',
          "Semester": `Semester ${s.semester}`,
          "Class Code": cls.code,
          "Intake Month": cls.month,
          "Intake Year": cls.year,
          "Module Code": subjectObj ? subjectObj.code : 'N/A',
          "Subject Name": subjectObj ? subjectObj.name : 'N/A',
          "Performance Score": s.score,
          "Sentiment Rating": getGrade(s.score).letter,
          "Lecturer Assigned": s.lecturer,
          "Submission Date": new Date(s.timestamp).toLocaleString()
        };

        // Inject custom answers as separate columns
        customQuestions.forEach(q => {
          const val = s.customAnswers ? s.customAnswers[q.id] : '';
          row[`Question: ${q.label}`] = Array.isArray(val) ? val.join(', ') : (val || '');
        });

        return row;
      });

      let ws;
      if (excelData.length > 0) {
        ws = XLSX.utils.json_to_sheet(excelData);
      } else {
        // Headers only placeholder
        const emptyHeaders = {
          "Student Name": "No records logged for this class",
          "Email": "",
          "Phone": "",
          "Program": "",
          "Semester": "",
          "Class Code": "",
          "Intake Month": "",
          "Intake Year": "",
          "Module Code": "",
          "Subject Name": "",
          "Performance Score": "",
          "Sentiment Rating": "",
          "Lecturer Assigned": "",
          "Submission Date": ""
        };
        customQuestions.forEach(q => {
          emptyHeaders[`Question: ${q.label}`] = "";
        });
        ws = XLSX.utils.json_to_sheet([emptyHeaders]);
      }

      // Safe sheet name (max 31 chars, no special characters, incorporating Intake and Code)
      const cleanName = `${cls.code}_${cls.month}_${cls.year}`.replace(/[\[\]\:\?\*\/\\ ]/g, '_').substring(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, cleanName || `Class_${cls.id}`);
    });

    let filterSuffix = '';
    if (filterSemester) filterSuffix += `_Semester_${filterSemester}`;
    if (filterYear) filterSuffix += `_Year_${filterYear}`;
    if (filterMonth) filterSuffix += `_${filterMonth}`;
    XLSX.writeFile(wb, `Student_Evaluation_Data${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Add or Edit Class (Auto-creates multiple Lecturers split by commas)
  const handleClassSubmit = async (e) => {
    e.preventDefault();
    if (!classSubjectId) {
      setCrudError('Please select a Module/Subject first.');
      return;
    }
    if (!newClassCode.trim() || !newClassLecturer.trim() || !newClassYear) {
      setCrudError('Class Code, Intake Year, and at least one Lecturer are required.');
      return;
    }

    // Load matching subject to inherit semester
    const subjectObj = subjects.find(s => s.id === classSubjectId);
    if (!subjectObj) {
      setCrudError('Invalid subject/module selection.');
      return;
    }

    // Parse comma-separated names
    const names = newClassLecturer.split(',').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) {
      setCrudError('At least one lecturer name must be provided.');
      return;
    }

    // Ensure all lecturers exist and obtain their IDs
    const lecturerIds = await Promise.all(names.map(name => ensureLecturerExists(name)));
    if (lecturerIds.some(id => !id)) {
      setCrudError('Error resolving one or more lecturer profiles.');
      return;
    }

    const targetSemester = parseInt(subjectObj.semester, 10);

    const classData = {
      code: newClassCode.trim().toUpperCase(),
      subjectId: classSubjectId,
      lecturerIds: lecturerIds,
      year: parseInt(newClassYear, 10),
      month: newClassMonth,
      semester: targetSemester
    };

    if (editingClass) {
      updateClass({
        id: editingClass.id,
        ...classData
      });
      setEditingClass(null);
    } else {
      addClass(classData);
    }

    // Reset Class Inputs
    setClassSubjectId('');
    setNewClassCode('');
    setNewClassYear(new Date().getFullYear());
    setNewClassMonth('July');
    setNewClassLecturer('');
    setCrudError('');
  };

  const startEditClass = (cls) => {
    setEditingClass(cls);
    setClassSubjectId(cls.subjectId);
    setNewClassCode(cls.code);
    setNewClassYear(cls.year || new Date().getFullYear());
    setNewClassMonth(cls.month || 'July');
    
    // Map IDs to names list
    const lecturerNames = (cls.lecturerIds || [])
      .map(id => {
        const l = lecturers.find(lec => lec.id === id);
        return l ? l.name : '';
      })
      .filter(Boolean)
      .join(', ');
    setNewClassLecturer(lecturerNames);
    setCrudError('');
  };

  // Add or Edit Subject (Module)
  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) {
      setCrudError('Subject name and module code are required.');
      return;
    }

    const subjectData = {
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase(),
      semester: parseInt(newSubSemester, 10),
      program: newSubProgram
    };

    if (editingSubject) {
      updateSubject({
        id: editingSubject.id,
        ...subjectData
      });
      setEditingSubject(null);
    } else {
      addSubject(subjectData);
    }

    setNewSubName('');
    setNewSubCode('');
    setNewSubSemester(1);
    setNewSubProgram('degree');
    setCrudError('');
  };

  const startEditSubject = (sub) => {
    setEditingSubject(sub);
    setNewSubName(sub.name);
    setNewSubCode(sub.code);
    setNewSubSemester(sub.semester || 1);
    setNewSubProgram(sub.program || 'degree');
    setCrudError('');
  };

  // Add or Edit Lecturer
  const handleLecturerSubmit = (e) => {
    e.preventDefault();
    if (!newLecturerName.trim()) {
      setCrudError('Lecturer name is required.');
      return;
    }

    if (editingLecturer) {
      updateLecturer({
        id: editingLecturer.id,
        name: newLecturerName.trim()
      });
      setEditingLecturer(null);
    } else {
      addLecturer(newLecturerName);
    }

    setNewLecturerName('');
    setCrudError('');
  };

  const startEditLecturer = (l) => {
    setEditingLecturer(l);
    setNewLecturerName(l.name);
    setCrudError('');
  };

  // Add or Edit Custom Question
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (!qLabel.trim()) {
      setCrudError('Question label is required.');
      return;
    }

    // Convert options text to array
    const options = qOptionsText
      ? qOptionsText.split(',').map(o => o.trim()).filter(o => o.length > 0)
      : [];

    if ((qType === 'radio' || qType === 'checkbox') && options.length < 2) {
      setCrudError('Multiple choice and checkboxes require at least 2 options.');
      return;
    }

    const questionData = {
      label: qLabel.trim(),
      type: qType,
      options,
      required: qRequired
    };

    if (editingQuestion) {
      updateQuestion({
        ...questionData,
        id: editingQuestion.id
      });
      setEditingQuestion(null);
    } else {
      addQuestion(questionData);
    }

    // Reset Form
    setQLabel('');
    setQType('short');
    setQOptionsText('');
    setQRequired(false);
    setCrudError('');
  };

  const startEditQuestion = (q) => {
    setEditingQuestion(q);
    setQLabel(q.label);
    setQType(q.type);
    setQOptionsText(q.options.join(', '));
    setQRequired(q.required);
    setCrudError('');
  };

  // Derive unique years and months from classes to populate logs filters
  const uniqueYears = Array.from(new Set(classes.map(c => c.year))).sort((a, b) => b - a);
  const uniqueMonths = Array.from(new Set(classes.map(c => c.month))).sort();

  // Filter Submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = filterClass ? s.classId === filterClass : true;
    const matchesSemester = filterSemester ? s.semester === parseInt(filterSemester, 10) : true;
    const matchesProgram = filterProgram ? s.program === filterProgram : true;

    // Lookup the class object for this submission to check year/month
    const classObj = classes.find(c => c.id === s.classId);
    const matchesYear = filterYear ? (classObj ? classObj.year === parseInt(filterYear, 10) : false) : true;
    const matchesMonth = filterMonth ? (classObj ? classObj.month === filterMonth : false) : true;

    return matchesSearch && matchesClass && matchesSemester && matchesProgram && matchesYear && matchesMonth;
  });

  // Calculate Metrics
  const getSubmissionsMetrics = () => {
    const classMetrics = classes.map(c => {
      const count = submissions.filter(subm => subm.classId === c.id).length;
      return { id: c.id, code: c.code, count };
    });

    const semesterMetrics = [1, 2, 3, 4, 5, 6].map(sem => {
      const count = submissions.filter(subm => subm.semester === sem).length;
      return { semester: sem, count };
    });

    return { classMetrics, semesterMetrics };
  };

  const { classMetrics, semesterMetrics } = getSubmissionsMetrics();

  return (
    <div className="app-container animate-fade-in" style={{ padding: '1.5rem' }}>
      
      {/* Top Header Controls Panel */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem' }}>
            Administrative Console
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Configure active semester parameters, CRUD master data, assign lecturers, and export spreadsheets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Form availability switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Evaluation Intake Portal:
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formActive} 
                onChange={(e) => setFormActive(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 'bold', 
              color: formActive ? 'var(--success)' : 'var(--danger)'
            }}>
              {formActive ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
            <button onClick={handleExportExcel} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              Export Multi-Tab Excel
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {filterSemester || filterProgram || filterYear || filterMonth ? '⚠️ Exports only matching filters' : 'Exports all configured classes'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setAdminTab('records')}
          className={`btn btn-sm ${adminTab === 'records' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Evaluation Records ({submissions.length})
        </button>

        <button 
          onClick={() => setAdminTab('classes')}
          className={`btn btn-sm ${adminTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Classes &amp; Subjects ({classes.length} Classes, {subjects.length} Modules, {lecturers.length} Lecturers)
        </button>

        <button 
          onClick={() => setAdminTab('formDesign')}
          className={`btn btn-sm ${adminTab === 'formDesign' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Form Design &amp; Semesters
        </button>
      </div>

      {/* TAB CONTENT: EVALUATION LOGS */}
      {adminTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Metrics summary widget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>
            
            {/* Logs table panel */}
            <div className="table-container glass-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by student name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select className="form-input" style={{ width: '150px' }} value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                  <option value="">All Programs</option>
                  <option value="foundation">Foundation</option>
                  <option value="degree">Degree</option>
                </select>

                <select className="form-input" style={{ width: '130px' }} value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                </select>

                {/* Intake Year filter */}
                <select className="form-input" style={{ width: '120px' }} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="">All Years</option>
                  {uniqueYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>

                {/* Intake Month filter */}
                <select className="form-input" style={{ width: '120px' }} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select className="form-input" style={{ width: '150px' }} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.code} ({c.month} {c.year})</option>
                  ))}
                </select>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 500 }}>No matching evaluation records found</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Try adjusting your search query or dropdown filter selectors.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Answers</th>
                      <th>Student</th>
                      <th>Class &amp; Subject</th>
                      <th style={{ width: '110px' }}>Score</th>
                      <th>Assigned Teacher</th>
                      <th>Submission Date</th>
                      <th style={{ textAlign: 'center', width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(s => {
                      const isExpanded = expandedSubmissionId === s.id;
                      const gradeObj = getGrade(s.score);
                      const classObj = classes.find(c => c.id === s.classId);
                      const subjectObj = subjects.find(sub => sub.id === s.subjectId);

                      return (
                        <React.Fragment key={s.id}>
                          <tr>
                            <td style={{ textAlign: 'center' }}>
                              {customQuestions.length > 0 && (
                                <button
                                  onClick={() => setExpandedSubmissionId(isExpanded ? null : s.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title={isExpanded ? "Hide answers" : "View answers"}
                                >
                                  {isExpanded ? "HIDE" : "SHOW"}
                                </button>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.email} | {s.phone}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                Class: {classObj ? `${classObj.code} (${classObj.month} ${classObj.year})` : 'Unknown Class'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {subjectObj ? `${subjectObj.name} (${subjectObj.code})` : 'Unknown Subject'} &bull; Sem {s.semester} ({s.program})
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.score}</span>
                                <span className={`badge ${gradeObj.class}`}>{gradeObj.letter}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.lecturer}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(s.timestamp).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={async () => {
                                  if (await showConfirm(`Are you sure you want to delete ${s.name}'s evaluation record?`)) {
                                    deleteSubmission(s.id);
                                  }
                                }}
                                className="btn btn-secondary btn-sm btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                title="Delete Submission Record"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ background: 'rgba(0,0,0,0.01)' }}>
                              <td colSpan={7} style={{ padding: '1rem 1.5rem' }}>
                                <div style={{ borderLeft: '2px solid var(--primary)', paddingLeft: '1rem' }}>
                                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.50rem' }}>
                                    Additional Questionnaire Responses
                                  </h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {customQuestions.map(q => {
                                      const answer = s.customAnswers ? s.customAnswers[q.id] : null;
                                      return (
                                        <div key={q.id} style={{ fontSize: '0.8rem' }}>
                                          <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{q.label}</div>
                                          <div style={{ color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                                            {answer !== undefined && answer !== null ? (
                                              Array.isArray(answer) ? answer.join(', ') : answer.toString()
                                            ) : (
                                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not answered</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Metrics Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Classes Metrics */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  Submission Count per Class
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {classMetrics.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{item.code}</span>
                      </div>
                      <span className="badge badge-info">{item.count}</span>
                    </div>
                  ))}
                  {classes.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No classes configured</span>}
                </div>
              </div>

              {/* Semesters Metrics */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  Submission Count per Term
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {semesterMetrics.map(item => (
                    <div key={item.semester} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span>Semester {item.semester}</span>
                      <span className="badge badge-success">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: UNIFIED CLASSES & SUBJECTS & LECTURERS */}
      {adminTab === 'classes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Classes Sub-Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setClassesSubTab('classesList')}
              className={`btn btn-sm ${classesSubTab === 'classesList' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Classes &amp; Lecturers ({classes.length})
            </button>
            <button
              onClick={() => setClassesSubTab('subjectsList')}
              className={`btn btn-sm ${classesSubTab === 'subjectsList' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Subjects / Modules Catalog ({subjects.length})
            </button>
            <button
              onClick={() => setClassesSubTab('lecturersList')}
              className={`btn btn-sm ${classesSubTab === 'lecturersList' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Lecturers Directory ({lecturers.length})
            </button>
          </div>

          {classesSubTab === 'classesList' && (
            /* SECTION 1: CLASSES MANAGER */
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Manage Classes (Opened Sections)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                <div className="table-container glass-panel">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Class Code</th>
                        <th>Subject (Module)</th>
                        <th>Lecturer(s)</th>
                        <th>Intake &amp; Term</th>
                        <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map(cls => {
                        const subjectObj = subjects.find(s => s.id === cls.subjectId);
                        
                        // Retrieve name for all assigned lecturers
                        const classLecturers = (cls.lecturerIds || [])
                          .map(id => lecturers.find(l => l.id === id))
                          .filter(Boolean);
                        const lecturerDisplay = classLecturers.length > 0
                          ? classLecturers.map(l => l.name).join(', ')
                          : 'Unknown Lecturer';

                        return (
                          <tr key={cls.id}>
                            <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{cls.code}</td>
                            <td>
                              {subjectObj ? (
                                <div style={{ fontSize: '0.85rem' }}>
                                  <span>{subjectObj.name}</span>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>({subjectObj.code})</span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned Module</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                              {lecturerDisplay}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              Intake: <span style={{ fontWeight: 600 }}>{cls.month} {cls.year}</span> &bull; Sem {cls.semester || 1} 
                              {subjectObj && (
                                <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                                  ({subjectObj.program})
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  onClick={() => startEditClass(cls)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title="Edit Class"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (await showConfirm(`Deleting class "${cls.code}" will automatically cascade and delete all submissions belonging to this class section. Proceed?`)) {
                                      deleteClass(cls.id);
                                    }
                                  }}
                                  className="btn btn-secondary btn-sm btn-danger"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title="Delete Class"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Create or Edit Class Card */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                      {editingClass ? 'Edit Class Configuration' : 'Create Class Configuration'}
                    </h3>

                    {crudError && (
                      <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        {crudError}
                      </div>
                    )}

                    <form onSubmit={handleClassSubmit}>
                      {/* Module Dropdown Selector */}
                      <div className="form-group">
                        <label className="form-label">Select Module / Subject</label>
                        <select
                          className="form-input btn-sm"
                          value={classSubjectId}
                          onChange={(e) => setClassSubjectId(e.target.value)}
                        >
                          <option value="">-- Choose Module --</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code}) [Sem {s.semester} - {s.program === 'foundation' ? 'Foundation' : 'Degree'}]
                            </option>
                          ))}
                        </select>
                        <span className="form-input-hint">Selecting a module auto-populates Program, Year and Semester.</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Class Code (e.g. S2A, S2B)</label>
                        <input
                          type="text"
                          className="form-input btn-sm"
                          placeholder="e.g. S2A"
                          value={newClassCode}
                          onChange={(e) => setNewClassCode(e.target.value)}
                        />
                      </div>

                      {/* Intake Year & Month Selectors */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Intake Year</label>
                          <input
                            type="number"
                            min="2000"
                            max="2100"
                            className="form-input btn-sm"
                            value={newClassYear}
                            onChange={(e) => setNewClassYear(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Intake Month</label>
                          <select
                            className="form-input btn-sm"
                            value={newClassMonth}
                            onChange={(e) => setNewClassMonth(e.target.value)}
                          >
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                          </select>
                        </div>
                      </div>

                      {/* Autocomplete Lecturer input box utilizing browser native datalist */}
                      <div className="form-group">
                        <label className="form-label">Assigned Lecturer(s)</label>
                        <input
                          type="text"
                          list="lecturer-suggestions"
                          className="form-input btn-sm"
                          placeholder="Separate multiple names with commas..."
                          value={newClassLecturer}
                          onChange={(e) => setNewClassLecturer(e.target.value)}
                        />
                        <datalist id="lecturer-suggestions">
                          {lecturers.map(l => (
                            <option key={l.id} value={l.name} />
                          ))}
                        </datalist>
                        <span className="form-input-hint">For 2-3 lecturers, type their names separated by commas (e.g., Dr. Evelyn, Prof. Turing).</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                          {editingClass ? 'Update Class' : 'Create Class'}
                        </button>
                        {editingClass && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClass(null);
                              setClassSubjectId('');
                              setNewClassCode('');
                              setNewClassYear(new Date().getFullYear());
                              setNewClassMonth('July');
                              setNewClassLecturer('');
                              setCrudError('');
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {classesSubTab === 'subjectsList' && (
            /* SECTION 2: SUBJECTS / MODULES MANAGER */
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Manage Subjects (Module Catalog)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                <div className="table-container glass-panel">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Module Code</th>
                        <th>Subject Name</th>
                        <th>Semester Cycle</th>
                        <th>Program</th>
                        <th style={{ textalign: 'center', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(sub => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{sub.code}</td>
                          <td>{sub.name}</td>
                          <td>
                            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                              Semester {sub.semester}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                              {sub.program || 'degree'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => startEditSubject(sub)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                title="Edit Subject"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (await showConfirm(`Deleting subject "${sub.name}" will automatically cascade and delete all classes and submissions associated with it. Proceed?`)) {
                                    deleteSubject(sub.id);
                                  }
                                }}
                                className="btn btn-secondary btn-sm btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                title="Delete Subject"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    {editingSubject ? 'Edit Subject Details' : 'Register New Subject'}
                  </h3>

                  {crudError && (
                    <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                      {crudError}
                    </div>
                  )}

                  <form onSubmit={handleSubjectSubmit}>
                    <div className="form-group">
                      <label className="form-label">Subject Name</label>
                      <input
                        type="text"
                        className="form-input btn-sm"
                        placeholder="e.g. Introduction to Programming"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Module Code</label>
                      <input
                        type="text"
                        className="form-input btn-sm"
                        placeholder="e.g. PROG101"
                        value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Program Type</label>
                      <select 
                        className="form-input btn-sm"
                        value={newSubProgram}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewSubProgram(val);
                          if (val === 'foundation' && newSubSemester > 2) {
                            setNewSubSemester(1);
                          }
                        }}
                      >
                        <option value="degree">Degree</option>
                        <option value="foundation">Foundation</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target Semester</label>
                      <select 
                        className="form-input btn-sm"
                        value={newSubSemester}
                        onChange={(e) => setNewSubSemester(parseInt(e.target.value, 10))}
                      >
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                        {newSubProgram === 'degree' && (
                          <>
                            <option value={3}>Semester 3</option>
                            <option value={4}>Semester 4</option>
                            <option value={5}>Semester 5</option>
                            <option value={6}>Semester 6</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                        {editingSubject ? 'Update Subject' : 'Register Subject'}
                      </button>
                      {editingSubject && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubject(null);
                            setNewSubName('');
                            setNewSubCode('');
                            setNewSubSemester(1);
                            setNewSubProgram('degree');
                            setCrudError('');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {classesSubTab === 'lecturersList' && (
            /* SECTION 3: LECTURERS MANAGER */
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Manage Lecturers (Staff Directory)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                <div className="table-container glass-panel">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Lecturer Name</th>
                        <th>Classes Currently Teaching</th>
                        <th style={{ textAlign: 'center', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecturers.map(l => {
                        const lClasses = classes.filter(c => (c.lecturerIds || []).includes(l.id));
                        return (
                          <tr key={l.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</td>
                            <td>
                              {lClasses.length > 0 ? (
                                lClasses.map(c => `${c.code}`).join(', ')
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>No active classes</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  onClick={() => startEditLecturer(l)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title="Edit Lecturer Name"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (await showConfirm(`Deleting lecturer "${l.name}" will automatically delete any classes they are teaching. Proceed?`)) {
                                      deleteLecturer(l.id);
                                    }
                                  }}
                                  className="btn btn-secondary btn-sm btn-danger"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title="Delete Lecturer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    {editingLecturer ? 'Edit Lecturer Details' : 'Register New Lecturer'}
                  </h3>

                  {crudError && (
                    <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                      {crudError}
                    </div>
                  )}

                  <form onSubmit={handleLecturerSubmit}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input btn-sm"
                        placeholder="e.g. Dr. Evelyn Martinez"
                        value={newLecturerName}
                        onChange={(e) => setNewLecturerName(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                        {editingLecturer ? 'Update Lecturer' : 'Register Lecturer'}
                      </button>
                      {editingLecturer && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLecturer(null);
                            setNewLecturerName('');
                            setCrudError('');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FORM DESIGN & SEMESTERS CONFIG */}
      {adminTab === 'formDesign' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Active Semesters Selector grid */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Active Semesters Configurations
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Toggle which semesters will appear on the Student Form for Foundation (Max 2 terms) and Degree (Max 6 terms) selections.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Foundation toggles */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Foundation Cycle
                  </h4>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    {[1, 2].map(sem => {
                      const isActive = activeSemesters.foundation.includes(sem);
                      return (
                        <label key={sem} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleSemesterActive('foundation', sem)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                          />
                          <span>Semester {sem}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Degree toggles */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Degree Cycle
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(sem => {
                      const isActive = activeSemesters.degree.includes(sem);
                      return (
                        <label key={sem} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleSemesterActive('degree', sem)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                          />
                          <span>Semester {sem}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Console Security Settings */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Console Security Settings
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Change the access credentials key required to unlock this Administrative Console.
              </p>

              {passwordChangeSuccess && (
                <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '1rem', background: 'var(--success-glow)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  Password updated successfully in database!
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
                  <label className="form-label">New Access Password</label>
                  <input
                    type="password"
                    placeholder="Enter new admin password"
                    className="form-input btn-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </form>
            </div>

            {/* Custom Google Forms-Style Questionnaire List */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Active Questionnaire Fields
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Manage custom survey questionnaire inputs loaded inside student evaluations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {customQuestions.map(q => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {q.label} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        Type: <span style={{ color: 'var(--secondary)', textTransform: 'capitalize' }}>{q.type}</span> 
                        {q.options.length > 0 && ` • Options: (${q.options.join(', ')})`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => startEditQuestion(q)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Question"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (await showConfirm(`Delete the custom question "${q.label}"?`)) {
                            deleteQuestion(q.id);
                          }
                        }}
                        className="btn btn-secondary btn-sm btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Delete Question"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {customQuestions.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    No additional questionnaire fields active. Create one on the right.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Create Question Sidebar */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              {editingQuestion ? 'Edit Question Field' : 'Create Question Field'}
            </h3>

            {crudError && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                {crudError}
              </div>
            )}

            <form onSubmit={handleQuestionSubmit}>
              <div className="form-group">
                <label className="form-label">Question Label</label>
                <input
                  type="text"
                  className="form-input btn-sm"
                  placeholder="e.g. Rate classroom facilities"
                  value={qLabel}
                  onChange={(e) => setQLabel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Input Type</label>
                <select className="form-input btn-sm" value={qType} onChange={(e) => setQType(e.target.value)}>
                  <option value="short">Short Answer Text</option>
                  <option value="long">Long Answer Essay</option>
                  <option value="radio">Multiple Choice (Radio Buttons)</option>
                  <option value="checkbox">Checkboxes</option>
                </select>
              </div>

              {(qType === 'radio' || qType === 'checkbox') && (
                <div className="form-group">
                  <label className="form-label">Options (Comma separated)</label>
                  <input
                    type="text"
                    className="form-input btn-sm"
                    placeholder="e.g. Excellent, Good, Poor"
                    value={qOptionsText}
                    onChange={(e) => setQOptionsText(e.target.value)}
                  />
                  <span className="form-input-hint">Provide at least two choices separated by commas.</span>
                </div>
              )}

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="qRequired"
                  checked={qRequired}
                  onChange={(e) => setQRequired(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="qRequired" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Mark this field as Required
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                  {editingQuestion ? 'Update Question' : 'Add Question Field'}
                </button>
                {editingQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQLabel('');
                      setQType('short');
                      setQOptionsText('');
                      setQRequired(false);
                      setCrudError('');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
