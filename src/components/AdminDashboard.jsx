import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { 
  Plus, Edit2, Trash2, Download, Search, Settings, 
  FolderPlus, BookOpen, Layers, Users, Calendar, 
  HelpCircle, Eye, EyeOff, Check, X, ClipboardSignature,
  FileSpreadsheet
} from 'lucide-react';
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
    
    // Lecturer Assignments context
    lecturerAssignments,
    addLecturerAssignment,
    deleteLecturerAssignment,
    
    customQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    
    activeSemesters,
    toggleSemesterActive,
    adminPassword,
    updateAdminPassword
  } = useAppState();

  // Tab controller for Admin Console
  const [adminTab, setAdminTab] = useState('records'); // 'records' | 'classes' | 'subjects' | 'formDesign'

  // Master Logs Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterProgram, setFilterProgram] = useState(''); // '' | 'foundation' | 'degree'

  // Row expansion state for custom answers
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  // Forms states for Classes
  const [editingClass, setEditingClass] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassYear, setNewClassYear] = useState(1);
  const [newClassSemester, setNewClassSemester] = useState(1);

  // Form states for Subjects
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubSemester, setNewSubSemester] = useState(1);

  // Lecturer Assignment interface states
  const [activeAssignmentClassId, setActiveAssignmentClassId] = useState(null);
  const [assigningLecturerBySubject, setAssigningLecturerBySubject] = useState({});

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

  // Excel exporter with custom question columns
  const handleExportExcel = () => {
    if (classes.length === 0) {
      alert("No classes configured. Please create classes first.");
      return;
    }

    const wb = XLSX.utils.book_new();

    classes.forEach(cls => {
      const classSubm = submissions.filter(s => s.classId === cls.id);

      const excelData = classSubm.map(s => {
        const subjectObj = subjects.find(sub => sub.id === s.subjectId);
        
        // Base student rows
        const row = {
          "Student Name": s.name,
          "Email": s.email,
          "Phone": s.phone,
          "Program": s.program === 'foundation' ? 'Foundation' : 'Degree',
          "Semester": `Semester ${s.semester}`,
          "Subject Code": subjectObj ? subjectObj.code : 'N/A',
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
          "Subject Code": "",
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

      // Safe sheet name (max 31 chars, no special characters)
      const cleanName = cls.name.replace(/[\[\]\:\?\*\/\\ ]/g, '_').substring(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, cleanName || `Class_${cls.id}`);
    });

    XLSX.writeFile(wb, `Student_Evaluation_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Add or Edit Class
  const handleClassSubmit = (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) {
      setCrudError('Class name and code are required.');
      return;
    }

    const classData = {
      name: newClassName.trim(),
      code: newClassCode.trim().toUpperCase(),
      year: parseInt(newClassYear, 10),
      semester: parseInt(newClassSemester, 10)
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

    setNewClassName('');
    setNewClassCode('');
    setNewClassYear(1);
    setNewClassSemester(1);
    setCrudError('');
  };

  const startEditClass = (cls) => {
    setEditingClass(cls);
    setNewClassName(cls.name);
    setNewClassCode(cls.code);
    setNewClassYear(cls.year || 1);
    setNewClassSemester(cls.semester || 1);
    setActiveAssignmentClassId(null); // Close assignment manager when editing
    setCrudError('');
  };

  // Add or Edit Subject
  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) {
      setCrudError('Subject name and module code are required.');
      return;
    }

    const subjectData = {
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase(),
      semester: parseInt(newSubSemester, 10)
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
    setCrudError('');
  };

  const startEditSubject = (sub) => {
    setEditingSubject(sub);
    setNewSubName(sub.name);
    setNewSubCode(sub.code);
    setNewSubSemester(sub.semester || 1);
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

  // Filter Submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = filterClass ? s.classId === filterClass : true;
    const matchesSemester = filterSemester ? s.semester === parseInt(filterSemester, 10) : true;
    const matchesProgram = filterProgram ? s.program === filterProgram : true;

    return matchesSearch && matchesClass && matchesSemester && matchesProgram;
  });

  // Calculate Metrics
  const getSubmissionsMetrics = () => {
    const classMetrics = classes.map(c => {
      const count = submissions.filter(subm => subm.classId === c.id).length;
      return { id: c.id, name: c.name, code: c.code, count };
    });

    const semesterMetrics = [1, 2, 3, 4, 5, 6].map(sem => {
      const count = submissions.filter(subm => subm.semester === sem).length;
      return { semester: sem, count };
    });

    return { classMetrics, semesterMetrics };
  };

  const { classMetrics, semesterMetrics } = getSubmissionsMetrics();

  // Unified Lecturer Assignments Manager for selected class
  const renderAssignmentsManager = (cls) => {
    // Get all subjects belonging to this class's semester
    const classSubjects = subjects.filter(sub => parseInt(sub.semester, 10) === parseInt(cls.semester, 10));

    return (
      <div className="glass-panel" style={{ padding: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardSignature size={18} color="var(--primary)" />
            Assignments: {cls.code}
          </h3>
          <button 
            onClick={() => setActiveAssignmentClassId(null)} 
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          >
            Close
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          This class is in <strong>Year {cls.year}, Semester {cls.semester}</strong>. Below are the subjects matching this semester. Assign teaching lecturers:
        </p>

        {classSubjects.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            No subjects configured for Semester {cls.semester} yet. Create subjects under the "Subjects" tab first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {classSubjects.map(sub => {
              const subLa = lecturerAssignments.filter(la => la.classId === cls.id && la.subjectId === sub.id);
              const inputVal = assigningLecturerBySubject[sub.id] || '';

              return (
                <div key={sub.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>{sub.code}</span>
                    </div>
                  </div>

                  {/* Current assigned lecturers for this subject */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {subLa.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No lecturers assigned yet</span>
                    ) : (
                      subLa.map(la => (
                        <div key={la.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                          <span>{la.lecturerName}</span>
                          <button 
                            onClick={() => deleteLecturerAssignment(la.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                            title="Remove Lecturer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick assign input */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Lecturer Name"
                      className="form-input btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                      value={inputVal}
                      onChange={(e) => setAssigningLecturerBySubject(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!inputVal.trim()) return;
                          addLecturerAssignment({
                            lecturerName: inputVal.trim(),
                            classId: cls.id,
                            semester: cls.semester,
                            subjectId: sub.id
                          });
                          setAssigningLecturerBySubject(prev => ({ ...prev, [sub.id]: '' }));
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (!inputVal.trim()) return;
                        addLecturerAssignment({
                          lecturerName: inputVal.trim(),
                          classId: cls.id,
                          semester: cls.semester,
                          subjectId: sub.id
                        });
                        setAssigningLecturerBySubject(prev => ({ ...prev, [sub.id]: '' }));
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
            background: 'rgba(255,255,255,0.02)',
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

          <button onClick={handleExportExcel} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <FileSpreadsheet size={18} />
            Export Multi-Tab Excel
          </button>
        </div>
      </div>

      {/* Admin Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setAdminTab('records')}
          className={`btn btn-sm ${adminTab === 'records' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <Layers size={14} />
          Evaluation Records ({submissions.length})
        </button>

        <button 
          onClick={() => setAdminTab('classes')}
          className={`btn btn-sm ${adminTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <Users size={14} />
          Classes &amp; Lecturers ({classes.length})
        </button>

        <button 
          onClick={() => setAdminTab('subjects')}
          className={`btn btn-sm ${adminTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <BookOpen size={14} />
          Manage Subjects ({subjects.length})
        </button>

        <button 
          onClick={() => setAdminTab('formDesign')}
          className={`btn btn-sm ${adminTab === 'formDesign' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <Settings size={14} />
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
                    style={{ paddingLeft: '2.25rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                <select className="form-input" style={{ width: '180px' }} value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                  <option value="">All Programs</option>
                  <option value="foundation">Foundation</option>
                  <option value="degree">Degree</option>
                </select>

                <select className="form-input" style={{ width: '150px' }} value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                </select>

                <select className="form-input" style={{ width: '180px' }} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <HelpCircle size={32} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 500 }}>No matching evaluation records found</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Try adjusting your search query or dropdown filter selectors.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}></th>
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
                            <td>
                              {customQuestions.length > 0 && (
                                <button
                                  onClick={() => setExpandedSubmissionId(isExpanded ? null : s.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    display: 'inline-flex'
                                  }}
                                  title={isExpanded ? "Collapse questionnaire answers" : "View custom questions answers"}
                                >
                                  {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.email} | {s.phone}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                {classObj ? classObj.name : 'Unknown Class'}
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
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${s.name}'s evaluation record?`)) {
                                    deleteSubmission(s.id);
                                  }
                                }}
                                className="btn btn-secondary btn-sm btn-danger"
                                style={{ padding: '0.35rem' }}
                                title="Delete Submission Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
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
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', marginRight: '0.35rem', color: 'var(--secondary)' }}>{item.code}</span>
                        <span>{item.name}</span>
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

      {/* TAB CONTENT: UNIFIED CLASSES & LECTURERS */}
      {adminTab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          <div className="table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class Code</th>
                  <th>Class Name</th>
                  <th>Year / Semester</th>
                  <th>Subjects &amp; Lecturers</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{cls.code}</td>
                    <td>{cls.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>Year {cls.year || 1} &bull; Sem {cls.semester || 1}</td>
                    <td>
                      {subjects.filter(s => parseInt(s.semester, 10) === parseInt(cls.semester, 10)).map(s => {
                        const la = lecturerAssignments.filter(la => la.classId === cls.id && la.subjectId === s.id);
                        return (
                          <div key={s.id} style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>{s.code}:</strong>{' '}
                            {la.length > 0 ? (
                              <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                {la.map(item => item.lecturerName).join(', ')}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </div>
                        );
                      })}
                      {subjects.filter(s => parseInt(s.semester, 10) === parseInt(cls.semester, 10)).length === 0 && (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>No subjects in Sem {cls.semester}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setEditingClass(null);
                            setActiveAssignmentClassId(cls.id);
                          }}
                          className={`btn btn-secondary btn-sm ${activeAssignmentClassId === cls.id ? 'btn-primary' : ''}`}
                          style={{ padding: '0.35rem' }}
                          title="Assign Lecturers"
                        >
                          <ClipboardSignature size={14} />
                        </button>
                        <button
                          onClick={() => startEditClass(cls)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem' }}
                          title="Edit Class"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deleting class "${cls.name}" will automatically cascade and delete all submissions & assignments belonging to this class. Proceed?`)) {
                              deleteClass(cls.id);
                            }
                          }}
                          className="btn btn-secondary btn-sm btn-danger"
                          style={{ padding: '0.35rem' }}
                          title="Delete Class"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeAssignmentClassId ? (
              renderAssignmentsManager(classes.find(c => c.id === activeAssignmentClassId))
            ) : (
              /* Create or Edit Class Card */
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderPlus size={18} color="var(--primary)" />
                  {editingClass ? 'Edit Class Configuration' : 'Create Class Configuration'}
                </h3>

                {crudError && (
                  <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                    {crudError}
                  </div>
                )}

                <form onSubmit={handleClassSubmit}>
                  <div className="form-group">
                    <label className="form-label">Class Name</label>
                    <input
                      type="text"
                      className="form-input btn-sm"
                      placeholder="e.g. Applied Cyber Security D"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Class Code</label>
                    <input
                      type="text"
                      className="form-input btn-sm"
                      placeholder="e.g. SEC404"
                      value={newClassCode}
                      onChange={(e) => setNewClassCode(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select 
                      className="form-input btn-sm"
                      value={newClassYear}
                      onChange={(e) => setNewClassYear(parseInt(e.target.value, 10))}
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select 
                      className="form-input btn-sm"
                      value={newClassSemester}
                      onChange={(e) => setNewClassSemester(parseInt(e.target.value, 10))}
                    >
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                      <option value={3}>Semester 3</option>
                      <option value={4}>Semester 4</option>
                      <option value={5}>Semester 5</option>
                      <option value={6}>Semester 6</option>
                    </select>
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
                          setNewClassName('');
                          setNewClassCode('');
                          setNewClassYear(1);
                          setNewClassSemester(1);
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
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MANAGE SUBJECTS */}
      {adminTab === 'subjects' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          <div className="table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module Code</th>
                  <th>Subject Name</th>
                  <th>Semester Cycle</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
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
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEditSubject(sub)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem' }}
                          title="Edit Subject"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deleting subject "${sub.name}" will automatically cascade and delete all submissions & lecturer assignments associated with it. Proceed?`)) {
                              deleteSubject(sub.id);
                            }
                          }}
                          className="btn btn-secondary btn-sm btn-danger"
                          style={{ padding: '0.35rem' }}
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus size={18} color="var(--primary)" />
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
                  placeholder="e.g. COMP101"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                />
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
                  <option value={3}>Semester 3</option>
                  <option value={4}>Semester 4</option>
                  <option value={5}>Semester 5</option>
                  <option value={6}>Semester 6</option>
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

      {/* TAB CONTENT: FORM DESIGN & SEMESTERS CONFIG */}
      {adminTab === 'formDesign' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Active Semesters Selector grid */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--primary)" />
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} color="var(--primary)" />
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
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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
                        style={{ padding: '0.25rem' }}
                        title="Edit Question"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete the custom question "${q.label}"?`)) {
                            deleteQuestion(q.id);
                          }
                        }}
                        className="btn btn-secondary btn-sm btn-danger"
                        style={{ padding: '0.25rem' }}
                        title="Delete Question"
                      >
                        <Trash2 size={12} />
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} color="var(--primary)" />
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
