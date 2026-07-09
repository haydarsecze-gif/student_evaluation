import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { 
  Plus, Edit2, Trash2, Download, Search, Settings, 
  FolderPlus, BookOpen, Layers, Users, Calendar, 
  HelpCircle, Eye, EyeOff, Check, X, ClipboardSignature
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

    // Phase 2 State / Handlers
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
  const [adminTab, setAdminTab] = useState('records'); // 'records' | 'classes' | 'subjects' | 'assignments' | 'formDesign'

  // Master Logs Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterProgram, setFilterProgram] = useState(''); // '' | 'foundation' | 'degree'

  // Row expansion state for custom answers
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  // Forms states
  const [editingClass, setEditingClass] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassLecturer, setNewClassLecturer] = useState('');

  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubType, setNewSubType] = useState('early'); // 'early' | 'end' | 'both'

  // Lecturer Assignments Creation Form state
  const [laLecturerName, setLaLecturerName] = useState('');
  const [laClassId, setLaClassId] = useState('');
  const [laSemester, setLaSemester] = useState('');
  const [laSubjectId, setLaSubjectId] = useState('');

  // Custom Question Form state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qLabel, setQLabel] = useState('');
  const [qType, setQType] = useState('short'); // 'short' | 'long' | 'radio' | 'checkbox'
  const [qOptionsText, setQOptionsText] = useState(''); // Comma-separated options
  const [qRequired, setQRequired] = useState(false);

  // Error messaging
  const [crudError, setCrudError] = useState('');
  
  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

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
          "Letter Grade": getGrade(s.score).letter,
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
          "Letter Grade": "",
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
    if (!newClassName.trim() || !newClassCode.trim() || !newClassLecturer.trim()) {
      setCrudError('All class fields are required.');
      return;
    }

    if (editingClass) {
      updateClass({
        id: editingClass.id,
        name: newClassName.trim(),
        code: newClassCode.trim().toUpperCase(),
        lecturer: newClassLecturer.trim()
      });
      setEditingClass(null);
    } else {
      addClass({
        name: newClassName.trim(),
        code: newClassCode.trim().toUpperCase(),
        lecturer: newClassLecturer.trim()
      });
    }

    setNewClassName('');
    setNewClassCode('');
    setNewClassLecturer('');
    setCrudError('');
  };

  // Add or Edit Subject
  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) {
      setCrudError('All subject fields are required.');
      return;
    }

    if (editingSubject) {
      updateSubject({
        id: editingSubject.id,
        name: newSubName.trim(),
        code: newSubCode.trim().toUpperCase(),
        type: newSubType
      });
      setEditingSubject(null);
    } else {
      addSubject({
        name: newSubName.trim(),
        code: newSubCode.trim().toUpperCase(),
        type: newSubType
      });
    }

    setNewSubName('');
    setNewSubCode('');
    setNewSubType('early');
    setCrudError('');
  };

  // Add Lecturer Assignment
  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    if (!laLecturerName.trim() || !laClassId || !laSemester || !laSubjectId) {
      setCrudError('Please fill out all assignment fields.');
      return;
    }

    addLecturerAssignment({
      lecturerName: laLecturerName.trim(),
      classId: laClassId,
      semester: parseInt(laSemester, 10),
      subjectId: laSubjectId
    });

    setLaLecturerName('');
    setLaClassId('');
    setLaSemester('');
    setLaSubjectId('');
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

  const getVisibleSubjectsForAssignment = () => {
    if (!laSemester) return [];
    const semNum = parseInt(laSemester, 10);
    const isEarlyYear = [1, 3, 5].includes(semNum);

    return subjects.filter(sub => {
      if (sub.type === 'both') return true;
      if (isEarlyYear && sub.type === 'early') return true;
      if (!isEarlyYear && sub.type === 'end') return true;
      return false;
    });
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
            <Download size={18} />
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
          Manage Classes ({classes.length})
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
          onClick={() => setAdminTab('assignments')}
          className={`btn btn-sm ${adminTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <ClipboardSignature size={14} />
          Lecturer Assignments ({lecturerAssignments.length})
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

      {/* TAB CONTENT: EVALUATION RECORDS */}
      {adminTab === 'records' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Side metrics panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Class distribution metrics */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Class Submission Load
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {classMetrics.map(cm => (
                  <div key={cm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{cm.name} ({cm.code})</span>
                    <span className="badge badge-info">{cm.count} submissions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Semester distribution metrics */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Semester Submission Load
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {semesterMetrics.map(sm => (
                  <div key={sm.semester} style={{ 
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semester {sm.semester}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>{sm.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Area: Filters and Master Data Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filters-group">
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    className="form-input btn-sm"
                    style={{ paddingLeft: '2.25rem', width: '180px', fontSize: '0.85rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                {/* Program filter */}
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    style={{ fontSize: '0.85rem', paddingRight: '2rem' }}
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                  >
                    <option value="">All Programs</option>
                    <option value="foundation">Foundation</option>
                    <option value="degree">Degree</option>
                  </select>
                </div>

                {/* Class filter */}
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    style={{ fontSize: '0.85rem', paddingRight: '2rem' }}
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Semester filter */}
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    style={{ fontSize: '0.85rem', paddingRight: '2rem' }}
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                  >
                    <option value="">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>
                </div>
              </div>

              {(searchQuery || filterClass || filterSemester || filterProgram) && (
                <button 
                  onClick={() => { setSearchQuery(''); setFilterClass(''); setFilterSemester(''); setFilterProgram(''); }}
                  className="btn btn-secondary btn-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Master Data Table */}
            <div className="table-container glass-panel">
              {filteredSubmissions.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class &amp; Semester</th>
                      <th>Subject</th>
                      <th>Performance</th>
                      <th>Lecturer</th>
                      <th style={{ textAlign: 'center' }}>Questionnaire</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(s => {
                      const classObj = classes.find(c => c.id === s.classId);
                      const subjectObj = subjects.find(sub => sub.id === s.subjectId);
                      const grade = getGrade(s.score);
                      const hasAnswers = s.customAnswers && Object.keys(s.customAnswers).length > 0;
                      const isExpanded = expandedSubmissionId === s.id;

                      return (
                        <React.Fragment key={s.id}>
                          <tr>
                            <td>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email} | {s.phone}</div>
                            </td>
                            <td>
                              <div>{classObj ? classObj.name : 'Unknown Class'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span style={{ textTransform: 'capitalize' }}>{s.program}</span> &bull; Sem {s.semester}
                              </div>
                            </td>
                            <td>
                              <div>{subjectObj ? subjectObj.name : 'Unknown Subject'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subjectObj ? subjectObj.code : ''}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.score}%</span>
                                <span className={`badge ${grade.class}`}>{grade.letter}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.lecturer}</td>
                            <td style={{ textAlign: 'center' }}>
                              {hasAnswers ? (
                                <button
                                  onClick={() => setExpandedSubmissionId(isExpanded ? null : s.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}
                                >
                                  {isExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                                  {isExpanded ? 'Hide' : 'View'}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>N/A</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the record of ${s.name}?`)) {
                                    deleteSubmission(s.id);
                                  }
                                }}
                                className="btn btn-secondary btn-sm btn-danger"
                                style={{ padding: '0.35rem' }}
                                title="Delete record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>

                          {/* Expansion Drawer showing Google Form custom questionnaire responses */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} style={{ background: 'rgba(99, 102, 241, 0.02)', padding: '1rem 1.5rem' }}>
                                <div className="glass-panel animate-fade-in" style={{ padding: '1rem', border: '1px dashed var(--primary-glow)', borderRadius: 'var(--radius-sm)' }}>
                                  <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                                    Additional Questionnaire Responses
                                  </h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {customQuestions.map(q => {
                                      const ans = s.customAnswers ? s.customAnswers[q.id] : null;
                                      return (
                                        <div key={q.id} style={{ fontSize: '0.8rem' }}>
                                          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{q.label}</div>
                                          <div style={{ color: 'var(--text-primary)', marginTop: '0.15rem', fontStyle: ans ? 'normal' : 'italic' }}>
                                            {ans 
                                              ? Array.isArray(ans) 
                                                ? ans.join(', ') 
                                                : ans 
                                              : 'No answer provided'}
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
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No student evaluations match the active filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MANAGE CLASSES */}
      {adminTab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          <div className="table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class Code</th>
                  <th>Class Name</th>
                  <th>Assigned Lecturer</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{cls.code}</td>
                    <td>{cls.name}</td>
                    <td>{cls.lecturer}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
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
                <label className="form-label">Default Lecturer</label>
                <input
                  type="text"
                  className="form-input btn-sm"
                  placeholder="e.g. Prof. Alan Turing"
                  value={newClassLecturer}
                  onChange={(e) => setNewClassLecturer(e.target.value)}
                />
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
      )}

      {/* TAB CONTENT: MANAGE SUBJECTS */}
      {adminTab === 'subjects' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          <div className="table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Semester Cycle Type</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{sub.code}</td>
                    <td>{sub.name}</td>
                    <td>
                      {sub.type === 'early' && <span className="badge badge-info">Early Year (S1, S3, S5)</span>}
                      {sub.type === 'end' && <span className="badge badge-warning">End Year (S2, S4, S6)</span>}
                      {sub.type === 'both' && <span className="badge badge-success">Universal (All terms)</span>}
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
                            if (confirm(`Deleting subject "${sub.name}" will automatically delete all evaluations & lecturer assignments mapped to it. Proceed?`)) {
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
              <BookOpen size={18} color="var(--primary)" />
              {editingSubject ? 'Edit Subject Configuration' : 'Create Subject Configuration'}
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
                  placeholder="e.g. Distributed Computing"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input
                  type="text"
                  className="form-input btn-sm"
                  placeholder="e.g. DIST303"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Academic Semester Cycle</label>
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value)}
                  >
                    <option value="early">Early Year Cycle (Semesters 1,3,5)</option>
                    <option value="end">End Year Cycle (Semesters 2,4,6)</option>
                    <option value="both">Universal Subject (All Semesters)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
                {editingSubject && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubject(null);
                      setNewSubName('');
                      setNewSubCode('');
                      setNewSubType('early');
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

      {/* TAB CONTENT: LECTURER ASSIGNMENTS */}
      {adminTab === 'assignments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Assignments list table */}
          <div className="table-container glass-panel">
            {lecturerAssignments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lecturer</th>
                    <th>Class</th>
                    <th>Semester</th>
                    <th>Subject</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturerAssignments.map(la => {
                    const classObj = classes.find(c => c.id === la.classId);
                    const subjectObj = subjects.find(sub => sub.id === la.subjectId);
                    return (
                      <tr key={la.id}>
                        <td style={{ fontWeight: 600 }}>{la.lecturerName}</td>
                        <td>{classObj ? classObj.name : 'Unknown Class'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>Semester {la.semester}</td>
                        <td>{subjectObj ? subjectObj.name : 'Unknown Subject'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => deleteLecturerAssignment(la.id)}
                            className="btn btn-secondary btn-sm btn-danger"
                            style={{ padding: '0.35rem' }}
                            title="Remove assignment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No lecturer assignments mapped. Fill the side form to assign lecturers.
              </div>
            )}
          </div>

          {/* Creation form */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardSignature size={18} color="var(--primary)" />
              Create Lecturer Assignment
            </h3>

            {crudError && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                {crudError}
              </div>
            )}

            <form onSubmit={handleAssignmentSubmit}>
              <div className="form-group">
                <label className="form-label">Lecturer Name</label>
                <input
                  type="text"
                  className="form-input btn-sm"
                  placeholder="e.g. Dr. Grace Hopper"
                  value={laLecturerName}
                  onChange={(e) => setLaLecturerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Class</label>
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    value={laClassId}
                    onChange={(e) => setLaClassId(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Semester</label>
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    value={laSemester}
                    onChange={(e) => setLaSemester(e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Subject</label>
                <div className="select-wrapper">
                  <select
                    disabled={!laSemester}
                    className="form-input btn-sm"
                    value={laSubjectId}
                    onChange={(e) => setLaSubjectId(e.target.value)}
                  >
                    <option value="">
                      {!laSemester ? 'Select Semester first' : 'Select Subject'}
                    </option>
                    {getVisibleSubjectsForAssignment().map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
                {laSemester && (
                  <span className="form-input-hint" style={{ color: 'var(--secondary)' }}>
                    Displaying only academic foundation subjects valid for Semester {laSemester}.
                  </span>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
                <Plus size={16} />
                Assign Lecturer
              </button>
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
                These questions render dynamically on the Student Form page.
              </p>

              {customQuestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customQuestions.map(q => (
                    <div key={q.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {q.label} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                          Type: {q.type === 'long' ? 'Paragraph' : q.type === 'short' ? 'Short Answer' : q.type}
                          {q.options.length > 0 && ` • Options: (${q.options.join(', ')})`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEditQuestion(q)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deleting "${q.label}" will remove this field from the questionnaire. Proceed?`)) {
                              deleteQuestion(q.id);
                            }
                          }}
                          className="btn btn-secondary btn-sm btn-danger"
                          style={{ padding: '0.35rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No custom questions configured. Use the builder side form to add some.
                </div>
              )}
            </div>
          </div>

          {/* Side Panel: Add/Edit Custom Question */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} color="var(--primary)" />
              {editingQuestion ? 'Edit Form Question' : 'Add Form Question'}
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
                  placeholder="e.g. Do you have programming experience?"
                  value={qLabel}
                  onChange={(e) => setQLabel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Input Type</label>
                <div className="select-wrapper">
                  <select
                    className="form-input btn-sm"
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                  >
                    <option value="short">Short Answer (Text)</option>
                    <option value="long">Paragraph (Long Text)</option>
                    <option value="radio">Multiple Choice (Radio Buttons)</option>
                    <option value="checkbox">Checkboxes (Select Multiple)</option>
                  </select>
                </div>
              </div>

              {(qType === 'radio' || qType === 'checkbox') && (
                <div className="form-group">
                  <label className="form-label">Options (Comma separated)</label>
                  <textarea
                    rows={2}
                    className="form-input btn-sm"
                    placeholder="e.g. Yes, No, A Little"
                    value={qOptionsText}
                    onChange={(e) => setQOptionsText(e.target.value)}
                  />
                  <span className="form-input-hint">Provide choice values separated by commas.</span>
                </div>
              )}

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="q-req-toggle"
                  checked={qRequired}
                  onChange={(e) => setQRequired(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="q-req-toggle" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                  Enforce Required Validation
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                  {editingQuestion ? 'Update Question' : 'Create Question'}
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
