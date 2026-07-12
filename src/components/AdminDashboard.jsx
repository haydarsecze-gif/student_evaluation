import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';

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

  // Dedicated Excel Exporter Download Filter states
  const [downloadSemester, setDownloadSemester] = useState('');
  const [downloadMonth, setDownloadMonth] = useState('');
  const [downloadYear, setDownloadYear] = useState('');

  // Master Logs sub-view settings
  const [recordsSubView, setRecordsSubView] = useState('individual'); // 'individual' | 'classSummary'
  const [summaryClassId, setSummaryClassId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState(null);

  // Grouped Class Feedback Summaries advanced filters
  const [summarySubjectId, setSummarySubjectId] = useState('');
  const [summaryYear, setSummaryYear] = useState('');
  const [summaryMonth, setSummaryMonth] = useState('');
  const [summarySectionCode, setSummarySectionCode] = useState('');

  // Detail Modal popup selection state
  const [selectedSubmissionForModal, setSelectedSubmissionForModal] = useState(null);

  // Forms states for Classes (Added Intake Year and Month)
  const [editingClass, setEditingClass] = useState(null);
  const [showLecturerSuggestions, setShowLecturerSuggestions] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
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
  const [qHorizontal, setQHorizontal] = useState(false);

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

  // Sentiment rating helper (Mapped to 1-5 scale)
  const getGrade = (numScore) => {
    const scoreInt = parseInt(numScore, 10);
    if (scoreInt === 5) return { letter: 'Love', class: 'badge-success' };
    if (scoreInt === 4) return { letter: 'Like', class: 'badge-info' };
    if (scoreInt === 3) return { letter: 'Normal', class: 'badge-warning' };
    if (scoreInt === 2) return { letter: 'Not Like', class: 'badge-warning' };
    return { letter: 'Hate', class: 'badge-danger' }; // 1
  };

  const handleExportExcel = async () => {
    // Filter classes based on active download filters (Semester, Year, Month)
    const filteredClasses = classes.filter(c => {
      const matchesSemester = downloadSemester ? c.semester === parseInt(downloadSemester, 10) : true;
      const matchesYear = downloadYear ? c.year === parseInt(downloadYear, 10) : true;
      const matchesMonth = downloadMonth ? c.month === downloadMonth : true;
      return matchesSemester && matchesYear && matchesMonth;
    });

    if (filteredClasses.length === 0) {
      showAlert("No classes match the chosen download filters.", "Export Error");
      return;
    }

    // Dynamic import SheetJS to reduce initial bundle chunk size by 300+ KB and speed up loading performance
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();

    filteredClasses.forEach(cls => {
      const classSubm = submissions.filter(s => s.classId === cls.id);

      const excelData = classSubm.map(s => {
        const subjectObj = subjects.find(sub => sub.id === s.subjectId);
        
        // Base student rows (includes Intake Year and Month columns)
        const row = {
          "Record No": getSubNumber(s.id),
          "Program": s.program === 'foundation' ? 'Foundation' : 'Degree',
          "Semester": `Semester ${s.semester}`,
          "Class Code": s.class_code || cls.code,
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
          const cleanLabel = q.label.endsWith('[row]') ? q.label.replace(/\s*\[row\]$/, '').trim() : q.label;
          row[`Question: ${cleanLabel}`] = Array.isArray(val) ? val.join(', ') : (val || '');
        });

        return row;
      });

      let ws;
      if (excelData.length > 0) {
        ws = XLSX.utils.json_to_sheet(excelData);
      } else {
        // Headers only placeholder
        const emptyHeaders = {
          "Record No": "No records logged for this class",
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
    if (downloadSemester) filterSuffix += `_Semester_${downloadSemester}`;
    if (downloadYear) filterSuffix += `_Year_${downloadYear}`;
    if (downloadMonth) filterSuffix += `_${downloadMonth}`;
    XLSX.writeFile(wb, `Student_Evaluation_Data${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Add or Edit Class (Auto-creates multiple Lecturers split by commas)
  const handleClassSubmit = async (e) => {
    e.preventDefault();
    if (!classSubjectId) {
      setCrudError('Please select a Module/Subject first.');
      return;
    }
     if (!newClassLecturer.trim() || !newClassYear) {
      setCrudError('Intake Year and at least one Lecturer are required.');
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
      code: newClassCode.trim() ? newClassCode.trim().toUpperCase() : '',
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

    let finalLabel = qLabel.trim();
    if ((qType === 'radio' || qType === 'checkbox') && qHorizontal) {
      if (!finalLabel.endsWith('[row]')) {
        finalLabel = `${finalLabel} [row]`;
      }
    } else {
      if (finalLabel.endsWith('[row]')) {
        finalLabel = finalLabel.replace(/\s*\[row\]$/, '').trim();
      }
    }

    const questionData = {
      label: finalLabel,
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
    setQHorizontal(false);
    setCrudError('');
  };

  const startEditQuestion = (q) => {
    setEditingQuestion(q);
    const isRow = q.label.endsWith('[row]');
    const cleanLabel = isRow ? q.label.replace(/\s*\[row\]$/, '').trim() : q.label;
    setQLabel(cleanLabel);
    setQType(q.type);
    setQOptionsText(q.options.join(', '));
    setQRequired(q.required);
    setQHorizontal(isRow);
    setCrudError('');
  };

  // Derive unique years and months from classes to populate logs filters
  const uniqueYears = Array.from(new Set(classes.map(c => c.year))).sort((a, b) => b - a);
  const uniqueMonths = Array.from(new Set(classes.map(c => c.month))).sort();

  // Sort submissions chronologically to assign a permanent "No. X" display number
  const sortedSubmissionsChronological = [...submissions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const getSubNumber = (subId) => {
    const index = sortedSubmissionsChronological.findIndex(sub => sub.id === subId);
    return index !== -1 ? `No. ${index + 1}` : 'Anonymous';
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter(s => {
    const classObj = classes.find(c => c.id === s.classId);

    const matchesSearch = 
      s.lecturer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = filterClass ? (s.class_code === filterClass || (classObj && classObj.code.split(',').map(x => x.trim()).includes(filterClass))) : true;
    const matchesSemester = filterSemester ? s.semester === parseInt(filterSemester, 10) : true;
    const matchesProgram = filterProgram ? s.program === filterProgram : true;
    const matchesYear = filterYear ? (classObj ? classObj.year === parseInt(filterYear, 10) : false) : true;
    const matchesMonth = filterMonth ? (classObj ? classObj.month === filterMonth : false) : true;

    return matchesSearch && matchesClass && matchesSemester && matchesProgram && matchesYear && matchesMonth;
  });

  // Calculate Metrics
  const getSubmissionsMetrics = () => {
    const codeCounts = {};
    classes.forEach(c => {
      const codes = c.code.split(',').map(x => x.trim()).filter(Boolean);
      codes.forEach(code => {
        codeCounts[code] = 0;
      });
    });

    submissions.forEach(s => {
      const classObj = classes.find(c => c.id === s.classId);
      const specificCode = s.class_code || (classObj ? classObj.code : 'Unknown');
      const parts = specificCode.split(',').map(x => x.trim()).filter(Boolean);
      parts.forEach(part => {
        if (codeCounts[part] === undefined) {
          codeCounts[part] = 0;
        }
        codeCounts[part]++;
      });
    });

    const classMetrics = Object.keys(codeCounts).map(code => {
      return { code, count: codeCounts[code] };
    }).sort((a, b) => a.code.localeCompare(b.code));

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flexGrow: 1, justifyContent: 'flex-end' }}>
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
              Portal:
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
              {formActive ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Dedicated Download Exporter Options Panel */}
          <div className="download-panel">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
              Excel Exporter Intake:
            </span>

            {/* Semester Select */}
            <select
              className="form-input btn-sm"
              style={{ width: '120px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', height: '28px' }}
              value={downloadSemester}
              onChange={(e) => setDownloadSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
            </select>

            {/* Month Select */}
            <select
              className="form-input btn-sm"
              style={{ width: '100px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', height: '28px' }}
              value={downloadMonth}
              onChange={(e) => setDownloadMonth(e.target.value)}
            >
              <option value="">All Months</option>
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

            {/* Year Select */}
            <select
              className="form-input btn-sm"
              style={{ width: '90px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', height: '28px' }}
              value={downloadYear}
              onChange={(e) => setDownloadYear(e.target.value)}
            >
              <option value="">All Years</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            <button 
              onClick={handleExportExcel} 
              className="btn btn-primary btn-sm" 
              style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
            >
              Export Excel
            </button>
          </div>

        </div>
      </div>

      {/* Admin Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
        <button 
          onClick={() => setAdminTab('records')}
          className={`btn btn-sm ${adminTab === 'records' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, minWidth: '160px', justifyContent: 'center', width: '100%' }}
        >
          Evaluation Records ({submissions.length})
        </button>

        <button 
          onClick={() => setAdminTab('classes')}
          className={`btn btn-sm ${adminTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1.5, minWidth: '220px', justifyContent: 'center', width: '100%' }}
        >
          Classes &amp; Subjects ({classes.length} Classes, {subjects.length} Modules, {lecturers.length} Lecturers)
        </button>

        <button 
          onClick={() => setAdminTab('formDesign')}
          className={`btn btn-sm ${adminTab === 'formDesign' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, minWidth: '180px', justifyContent: 'center', width: '100%' }}
        >
          Form Design &amp; Semesters
        </button>
      </div>

      {/* TAB CONTENT: EVALUATION LOGS */}
      {adminTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* View Format Sub-navigation toggles */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(0,0,0,0.02)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            alignSelf: 'stretch',
            width: '100%',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>View Format:</span>
            <button
              onClick={() => setRecordsSubView('individual')}
              className={`btn btn-sm ${recordsSubView === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', flex: 1, justifyContent: 'center', width: '100%' }}
            >
              Individual Student Logs ({submissions.length})
            </button>
            <button
              onClick={() => setRecordsSubView('classSummary')}
              className={`btn btn-sm ${recordsSubView === 'classSummary' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', flex: 1, justifyContent: 'center', width: '100%' }}
            >
              Grouped Class Feedback Summaries
            </button>
          </div>

          {recordsSubView === 'individual' ? (
            /* SUB-VIEW 1: INDIVIDUAL LOGS - MASTER-DETAIL SPLIT LAYOUT */
            (() => {
              const activeSub = filteredSubmissions.find(s => s.id === selectedSubId) || filteredSubmissions[0];

              return (
                <div className="master-detail-grid">
                  
                  {/* Left Column: Scrollable List of Submissions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Search & Filter Controls Panel */}
                    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: '100%' }}
                          placeholder="Search lecturer..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <select className="form-input" value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                          <option value="">All Programs</option>
                          <option value="foundation">Foundation</option>
                          <option value="degree">Degree</option>
                        </select>

                        <select className="form-input" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                          <option value="">All Semesters</option>
                          {[1,2,3,4,5,6].map(sem => (
                            <option key={sem} value={sem}>Sem {sem}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <select className="form-input" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                          <option value="">All Years</option>
                          {uniqueYears.map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>

                        <select className="form-input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                          <option value="">All Months</option>
                          {uniqueMonths.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <select className="form-input" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                        <option value="">All Class Sections</option>
                        {(() => {
                          const codesSet = new Set();
                          classes.forEach(c => {
                            c.code.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {
                              codesSet.add(code);
                            });
                          });
                          return Array.from(codesSet).sort().map(code => (
                            <option key={code} value={code}>{code}</option>
                          ));
                        })()}
                      </select>
                    </div>

                    {/* Submissions List */}
                    <div className="submissions-list-scrollable" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {filteredSubmissions.map(s => {
                        const classObj = classes.find(c => c.id === s.classId);
                        const subjectObj = subjects.find(sub => sub.id === s.subjectId);
                        const gradeObj = getGrade(s.score);
                        const isActive = activeSub && activeSub.id === s.id;

                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedSubId(s.id)}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                cursor: 'pointer',
                                borderLeft: isActive ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                                background: isActive ? 'rgba(219, 39, 119, 0.03)' : 'var(--bg-card)',
                                transform: isActive ? 'scale(1.01)' : 'none',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: 650, fontSize: '0.95rem' }}>{getSubNumber(s.id)}</span>
                              <span className={`badge ${gradeObj.class}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                {gradeObj.letter} ({s.score})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {(() => {
                                const classCodeVal = (s.class_code || (classObj ? classObj.code : '')).trim();
                                const subjectDisplayStr = subjectObj ? `${subjectObj.name} (${subjectObj.code})` : 'Unknown Module';
                                if (classCodeVal) {
                                  return (
                                    <>
                                      Class: <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{classCodeVal}</span> • {subjectDisplayStr}
                                    </>
                                  );
                                }
                                return subjectDisplayStr;
                              })()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{s.lecturer}</span>
                              <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredSubmissions.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No submissions match the filter requirements.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeSub ? (() => {
                      const classObj = classes.find(c => c.id === activeSub.classId);
                      const subjectObj = subjects.find(sub => sub.id === activeSub.subjectId);
                      const gradeObj = getGrade(activeSub.score);

                      return (
                        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '500px' }}>
                          {/* Panel Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Evaluation Profile Details
                              </span>
                              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {getSubNumber(activeSub.id)}
                              </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(activeSub.timestamp).toLocaleString()}
                              </span>
                              <button
                                onClick={async () => {
                                  if (await showConfirm(`Are you sure you want to permanently delete this feedback submission?`)) {
                                    deleteSubmission(activeSub.id);
                                    setSelectedSubId(null);
                                  }
                                }}
                                className="btn btn-secondary btn-sm btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginTop: '0.25rem' }}
                              >
                                Delete Record
                              </button>
                            </div>
                          </div>

                          {/* Info grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', background: 'rgba(0,0,0,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>CLASS SECTION</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>
                                {activeSub.class_code || (classObj ? classObj.code : 'N/A')}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>MODULE SUBJECT</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {subjectObj ? `${subjectObj.name} (${subjectObj.code})` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>TERM &amp; PROGRAM</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                Sem {activeSub.semester} ({activeSub.program})
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>INTAKE BATCH</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                {classObj ? `${classObj.month} ${classObj.year}` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>EVALUATED TEACHER</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                                {activeSub.lecturer}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>OVERALL RATING</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 750 }}>{activeSub.score} / 5</span>
                                <span className={`badge ${gradeObj.class}`}>{gradeObj.letter}</span>
                              </div>
                            </div>
                          </div>

                          {/* Survey feedback responses */}
                          <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                              Questionnaire Responses
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {customQuestions.map(q => {
                                const answer = activeSub.customAnswers ? activeSub.customAnswers[q.id] : null;
                                return (
                                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                      {q.label.endsWith('[row]') ? q.label.replace(/\s*\[row\]$/, '').trim() : q.label}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.85rem', 
                                      color: 'var(--text-primary)', 
                                      whiteSpace: 'pre-wrap', 
                                      lineHeight: '1.5',
                                      wordBreak: 'break-word',
                                      fontStyle: answer !== undefined && answer !== null ? 'normal' : 'italic'
                                    }}>
                                      {answer !== undefined && answer !== null ? (
                                        Array.isArray(answer) ? answer.join(', ') : answer.toString()
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>Not answered</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                              {customQuestions.length === 0 && (
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                                  No additional custom questionnaire responses configured.
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })() : (
                      <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '500px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Log Selected</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Select a student evaluation card from the left panel to display details.
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()
          ) : (
            /* SUB-VIEW 2: GROUPED CLASS SUMMARIES - MULTI-FILTER FEEDBACK DASHBOARD */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Advanced Filter Bar Panel */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Grouped Class Feedback Summaries
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Filter survey questionnaire responses by module, intake month/year, and specific class sections.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {/* Filter 1: Subject / Module */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>MODULE / SUBJECT</span>
                    <select
                      className="form-input"
                      value={summarySubjectId}
                      onChange={(e) => {
                        setSummarySubjectId(e.target.value);
                        setSummarySectionCode(''); // Reset section code to avoid mismatched filters
                      }}
                    >
                      <option value="">All Subjects / Modules</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 2: Intake Year */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>INTAKE YEAR</span>
                    <select
                      className="form-input"
                      value={summaryYear}
                      onChange={(e) => {
                        setSummaryYear(e.target.value);
                        setSummarySectionCode('');
                      }}
                    >
                      <option value="">All Years</option>
                      {uniqueYears.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 3: Intake Month */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>INTAKE MONTH</span>
                    <select
                      className="form-input"
                      value={summaryMonth}
                      onChange={(e) => {
                        setSummaryMonth(e.target.value);
                        setSummarySectionCode('');
                      }}
                    >
                      <option value="">All Months</option>
                      {uniqueMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 4: Specific Class Section Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CLASS CODE (S2A / S2B)</span>
                    <select
                      className="form-input"
                      value={summarySectionCode}
                      onChange={(e) => setSummarySectionCode(e.target.value)}
                    >
                      <option value="">All Class Sections</option>
                      {(() => {
                        // Dynamically list class codes based on other matches
                        const codes = new Set();
                        classes.forEach(c => {
                          const matchesSubject = summarySubjectId ? c.subjectId === summarySubjectId : true;
                          const matchesYear = summaryYear ? c.year === parseInt(summaryYear, 10) : true;
                          const matchesMonth = summaryMonth ? c.month === summaryMonth : true;
                          
                          if (matchesSubject && matchesYear && matchesMonth) {
                            c.code.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {
                              codes.add(code);
                            });
                          }
                        });
                        return Array.from(codes).sort().map(code => (
                          <option key={code} value={code}>{code}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              {(() => {
                // Filter submissions dynamically
                const classSubmissions = submissions.filter(s => {
                  const classObj = classes.find(c => c.id === s.classId);
                  
                  const matchesSubject = summarySubjectId ? s.subjectId === summarySubjectId : true;
                  const matchesYear = summaryYear ? (classObj && classObj.year === parseInt(summaryYear, 10)) : true;
                  const matchesMonth = summaryMonth ? (classObj && classObj.month === summaryMonth) : true;
                  
                  // For specific class code matches
                  const specificCode = s.class_code || (classObj ? classObj.code.split(',').map(x => x.trim())[0] : '');
                  const matchesSection = summarySectionCode ? specificCode === summarySectionCode : true;

                  return matchesSubject && matchesYear && matchesMonth && matchesSection;
                });

                if (classSubmissions.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 500 }}>No Submissions Found</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        No evaluation feedback records match your chosen filter parameters.
                      </div>
                    </div>
                  );
                }

                // Calculate class average score (precise decimal)
                const scores = classSubmissions.map(s => s.score);
                const avgScore = scores.length > 0 
                  ? scores.reduce((a, b) => a + b, 0) / scores.length 
                  : 0;

                // Sentiment breakdown count
                const sentimentCount = { Love: 0, Like: 0, Normal: 0, NotLike: 0, Hate: 0 };
                classSubmissions.forEach(s => {
                  const gradeObj = getGrade(s.score);
                  if (gradeObj.letter === 'Love') sentimentCount.Love++;
                  else if (gradeObj.letter === 'Like') sentimentCount.Like++;
                  else if (gradeObj.letter === 'Normal') sentimentCount.Normal++;
                  else if (gradeObj.letter === 'Not Like') sentimentCount.NotLike++;
                  else if (gradeObj.letter === 'Hate') sentimentCount.Hate++;
                });

                // Find metadata strings
                const selectedSubject = subjects.find(sub => sub.id === summarySubjectId);
                const moduleName = selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'All Modules Combined';
                const intakeString = (summaryMonth || summaryYear) 
                  ? `${summaryMonth || ''} ${summaryYear || ''}`.trim() 
                  : 'All Intakes Combined';
                const sectionString = summarySectionCode || 'All Class Sections Combined';

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Aggregated Metadata Dashboard Summary Card */}
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: 'rgba(0,0,0,0.01)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>CLASS SECTION(S)</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>
                          {sectionString}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>SUBJECT MODULE</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                          {moduleName}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>INTAKE BATCH</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                          {intakeString}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>TOTAL SUBMISSIONS</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {classSubmissions.length} Evaluation{classSubmissions.length !== 1 && 's'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>AVG RATING</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{avgScore > 0 ? `${avgScore.toFixed(1)} / 5` : 'N/A'}</span>
                          {avgScore > 0 && (
                            <span className={`badge ${getGrade(Math.round(avgScore)).class}`}>{getGrade(Math.round(avgScore)).letter}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>SENTIMENT DISTRIBUTION</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-success">Love: {sentimentCount.Love}</span>
                          <span className="badge badge-info">Like: {sentimentCount.Like}</span>
                          <span className="badge badge-warning">Normal: {sentimentCount.Normal}</span>
                          <span className="badge badge-warning" style={{ background: 'rgba(217, 119, 6, 0.1)' }}>Not Like: {sentimentCount.NotLike}</span>
                          <span className="badge badge-danger">Hate: {sentimentCount.Hate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Loop over Questionnaire Questions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Feedback Responses Grouped by Question
                      </h3>

                      {customQuestions.map(q => {
                        // Gather answers from these filtered submissions
                        const answers = classSubmissions.map(s => {
                          const val = s.customAnswers ? s.customAnswers[q.id] : null;
                          const classObj = classes.find(c => c.id === s.classId);
                          const subjectObj = subjects.find(sub => sub.id === s.subjectId);
                          return {
                            studentName: s.name,
                            studentEmail: s.email,
                            score: s.score,
                            classCode: s.class_code || (classObj ? classObj.code.split(',').map(x => x.trim())[0] : 'Unknown'),
                            lecturer: s.lecturer,
                            moduleName: subjectObj ? subjectObj.name : 'N/A',
                            moduleCode: subjectObj ? subjectObj.code : 'N/A',
                            value: val
                          };
                        }).filter(a => a.value !== undefined && a.value !== null && a.value !== '');

                        return (
                          <div key={q.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>
                                {q.label.endsWith('[row]') ? q.label.replace(/\s*\[row\]$/, '').trim() : q.label}
                              </h4>
                              <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                                {q.type} response
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                              {answers.map((ans, idx) => (
                                <div key={idx} style={{
                                  padding: '1rem',
                                  background: 'rgba(0,0,0,0.01)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem'
                                }}>
                                  <div style={{ 
                                    fontSize: '0.9rem', 
                                    color: 'var(--text-primary)', 
                                    whiteSpace: 'pre-wrap', 
                                    lineHeight: '1.5',
                                    wordBreak: 'break-word'
                                  }}>
                                    {Array.isArray(ans.value) ? ans.value.join(', ') : ans.value.toString()}
                                  </div>
                                  
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    borderTop: '1px dashed var(--border-color)',
                                    paddingTop: '0.5rem',
                                    marginTop: '0.25rem'
                                  }}>
                                    <div>
                                      Class Section: <span style={{ fontWeight: 600, color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>{ans.classCode}</span> &bull; Teacher: <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{ans.lecturer}</span>
                                    </div>
                                    <div style={{ fontWeight: 500 }}>
                                      No. {idx + 1} &bull; {ans.moduleName} ({ans.moduleCode}) &bull; Rating: <span style={{ fontWeight: 700 }}>{ans.score} / 5</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {answers.length === 0 && (
                                <span style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                  No student responses logged for this questionnaire input matching the chosen parameters.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {customQuestions.length === 0 && (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                            No custom survey questionnaire fields have been created in active configurations. Create questions in the "Form Design" tab to see grouped answers.
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT: UNIFIED CLASSES & SUBJECTS & LECTURERS */}
      {adminTab === 'classes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Classes Sub-Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
            <button
              onClick={() => setClassesSubTab('classesList')}
              className={`btn btn-sm ${classesSubTab === 'classesList' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flex: 1, minWidth: '150px', justifyContent: 'center', width: '100%' }}
            >
              Classes &amp; Lecturers ({classes.length})
            </button>
            <button
              onClick={() => setClassesSubTab('subjectsList')}
              className={`btn btn-sm ${classesSubTab === 'subjectsList' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flex: 1, minWidth: '180px', justifyContent: 'center', width: '100%' }}
            >
              Subjects / Modules Catalog ({subjects.length})
            </button>
            <button
              onClick={() => setClassesSubTab('lecturersList')}
              className={`btn btn-sm ${classesSubTab === 'lecturersList' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flex: 1, minWidth: '150px', justifyContent: 'center', width: '100%' }}
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
              <div className="responsive-grid-container">
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
                            <td data-label="Class Code" style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{cls.code || '[No Code]'}</td>
                            <td data-label="Subject (Module)">
                              {subjectObj ? (
                                <div style={{ fontSize: '0.85rem' }}>
                                  <span>{subjectObj.name}</span>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>({subjectObj.code})</span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned Module</span>
                              )}
                            </td>
                            <td data-label="Lecturer(s)" style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                              {lecturerDisplay}
                            </td>
                            <td data-label="Intake & Term" style={{ fontSize: '0.85rem' }}>
                              Intake: <span style={{ fontWeight: 600 }}>{cls.month} {cls.year}</span> &bull; Sem {cls.semester || 1} 
                              {subjectObj && (
                                <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                                  ({subjectObj.program})
                                </span>
                              )}
                            </td>
                            <td data-label="Actions" style={{ textAlign: 'center' }}>
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
                      {/* Searchable Module Dropdown Selector */}
                      {(() => {
                        const selectedSubjectObj = subjects.find(s => s.id === classSubjectId);
                        
                        // Active modules list
                        const activeDropdownSubjects = subjects.filter(s => {
                          if (editingClass && editingClass.subjectId === s.id) return true;
                          const activeList = activeSemesters[s.program] || [];
                          return activeList.includes(s.semester);
                        });
                        
                        // Search filter
                        const filteredDropdownSubjects = activeDropdownSubjects.filter(s => {
                          const query = moduleSearchQuery.toLowerCase().trim();
                          if (!query) return true;
                          return s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query);
                        });
                        
                        return (
                          <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">Select Module / Subject</label>
                            
                            {/* Backdrop overlay to close when clicking outside */}
                            {showModuleDropdown && (
                              <div 
                                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                                onClick={() => { setShowModuleDropdown(false); setModuleSearchQuery(''); }}
                              />
                            )}

                            <div 
                              className="form-input btn-sm"
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.5rem 0.75rem',
                                minHeight: '38px',
                                userSelect: 'none',
                                position: 'relative',
                                zIndex: 999
                              }}
                              onClick={() => setShowModuleDropdown(!showModuleDropdown)}
                            >
                              <span style={{ color: selectedSubjectObj ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {selectedSubjectObj 
                                  ? `${selectedSubjectObj.name} (${selectedSubjectObj.code}) [Sem ${selectedSubjectObj.semester} - ${selectedSubjectObj.program === 'foundation' ? 'Foundation' : 'Degree'}]`
                                  : '-- Choose Module --'
                                }
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>▼</span>
                            </div>

                            {showModuleDropdown && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 999,
                                marginTop: '0.25rem',
                                padding: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                              }}>
                                <input
                                  type="text"
                                  className="form-input btn-sm"
                                  style={{ width: '100%', border: '1px solid var(--border-color)' }}
                                  placeholder="Type subject name or code to search..."
                                  value={moduleSearchQuery}
                                  onChange={(e) => setModuleSearchQuery(e.target.value)}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on search input click
                                />
                                
                                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {filteredDropdownSubjects.length > 0 ? (
                                    filteredDropdownSubjects.map(s => (
                                      <div
                                        key={s.id}
                                        onClick={() => {
                                          setClassSubjectId(s.id);
                                          setShowModuleDropdown(false);
                                          setModuleSearchQuery('');
                                        }}
                                        style={{
                                          padding: '0.5rem 0.75rem',
                                          cursor: 'pointer',
                                          fontSize: '0.85rem',
                                          borderRadius: '4px',
                                          background: classSubjectId === s.id ? 'var(--primary-glow)' : 'none',
                                          color: classSubjectId === s.id ? 'var(--primary)' : 'var(--text-primary)',
                                          transition: 'background 0.2s',
                                          textAlign: 'left'
                                        }}
                                        onMouseOver={(e) => {
                                          if (classSubjectId !== s.id) {
                                            e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                                          }
                                        }}
                                        onMouseOut={(e) => {
                                          if (classSubjectId !== s.id) {
                                            e.currentTarget.style.background = 'none';
                                          }
                                        }}
                                      >
                                        <strong>{s.code}</strong> - {s.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>[Sem {s.semester} &bull; {s.program === 'foundation' ? 'Foundation' : 'Degree'}]</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      No modules match your query.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <span className="form-input-hint">Selecting a module auto-populates Program, Year and Semester.</span>
                          </div>
                        );
                      })()}

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

                      {/* Autocomplete Lecturer input box utilizing custom multi-value suggestion dropdown */}
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Assigned Lecturer(s)</label>
                        <input
                          type="text"
                          className="form-input btn-sm"
                          placeholder="Separate multiple names with commas..."
                          value={newClassLecturer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewClassLecturer(val);
                            // Only trigger suggestions list if user is typing a word segment
                            const lastSegment = val.split(',').pop() || '';
                            if (lastSegment.trim().length > 0) {
                              setShowLecturerSuggestions(true);
                            } else {
                              setShowLecturerSuggestions(false);
                            }
                          }}
                          onFocus={() => {
                            const lastSegment = newClassLecturer.split(',').pop() || '';
                            if (lastSegment.trim().length > 0) {
                              setShowLecturerSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay dismissal slightly to allow clicks to register on the dropdown options list
                            setTimeout(() => setShowLecturerSuggestions(false), 200);
                          }}
                        />
                        {showLecturerSuggestions && (() => {
                          const lastSegment = (newClassLecturer.split(',').pop() || '').trim().toLowerCase();
                          const lowerVal = newClassLecturer.toLowerCase();
                          const matching = lastSegment 
                            ? lecturers.filter(l => 
                                l.name.toLowerCase().includes(lastSegment) && 
                                !lowerVal.includes(l.name.toLowerCase().trim())
                              )
                            : [];
                          
                          if (matching.length === 0) return null;

                          return (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: 'var(--shadow-lg)',
                              zIndex: 999,
                              maxHeight: '180px',
                              overflowY: 'auto',
                              marginTop: '0.25rem'
                            }}>
                              {matching.map(l => (
                                <div
                                  key={l.id}
                                  onClick={() => {
                                    const parts = newClassLecturer.split(',');
                                    // Replace last segment with the lecturer's name
                                    parts[parts.length - 1] = ` ${l.name}`;
                                    // Re-join with commas, append a trailing comma/space for next input helper
                                    setNewClassLecturer(parts.join(', ').replace(/^\s*,\s*/, '').trim() + ', ');
                                    setShowLecturerSuggestions(false);
                                  }}
                                  style={{
                                    padding: '0.6rem 1rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--border-color)',
                                    transition: 'background 0.2s',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => e.target.style.background = 'rgba(219, 39, 119, 0.05)'}
                                  onMouseOut={(e) => e.target.style.background = 'none'}
                                >
                                  {l.name}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
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
              <div className="responsive-grid-container">
                <div className="table-container glass-panel">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Module Code</th>
                        <th>Subject Name</th>
                        <th>Semester Cycle</th>
                        <th>Program</th>
                        <th style={{ textAlign: 'center', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(sub => (
                        <tr key={sub.id}>
                          <td data-label="Module Code" style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{sub.code}</td>
                          <td data-label="Subject Name">{sub.name}</td>
                          <td data-label="Semester Cycle">
                            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                              Semester {sub.semester}
                            </span>
                          </td>
                          <td data-label="Program">
                            <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                              {sub.program || 'degree'}
                            </span>
                          </td>
                          <td data-label="Actions" style={{ textAlign: 'center' }}>
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
              <div className="responsive-grid-container">
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
                            <td data-label="Lecturer Name" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</td>
                            <td data-label="Classes Teaching">
                              {lClasses.length > 0 ? (
                                lClasses.map(c => {
                                  const subjectObj = subjects.find(sub => sub.id === c.subjectId);
                                  const subjectDisplay = subjectObj ? subjectObj.name : 'Unknown Module';
                                  const codeDisplay = c.code ? ` [Class: ${c.code}]` : '';
                                  return `${subjectDisplay}${codeDisplay}`;
                                }).join('; ')
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>No active classes</span>
                              )}
                            </td>
                            <td data-label="Actions" style={{ textAlign: 'center' }}>
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
        <div className="responsive-grid-container">
          
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
                        {q.label.endsWith('[row]') ? q.label.replace(/\s*\[row\]$/, '').trim() : q.label} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        Type: <span style={{ color: 'var(--secondary)', textTransform: 'capitalize' }}>{q.type}{q.label.endsWith('[row]') ? ' (Row Layout)' : ''}</span> 
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
                <>
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

                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    <input
                      type="checkbox"
                      id="qHorizontal"
                      checked={qHorizontal}
                      onChange={(e) => setQHorizontal(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <label htmlFor="qHorizontal" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.85rem' }}>
                      Display options horizontally in a row
                    </label>
                  </div>
                </>
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

      {/* Detailed Evaluation Record Modal Popup */}
      {selectedSubmissionForModal && (() => {
        const s = selectedSubmissionForModal;
        const classObj = classes.find(c => c.id === s.classId);
        const subjectObj = subjects.find(sub => sub.id === s.subjectId);
        const gradeObj = getGrade(s.score);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div className="glass-panel" style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              borderTop: '4px solid var(--primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Student Evaluation Detail
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {getSubNumber(s.id)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSubmissionForModal(null)}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 300,
                    lineHeight: '1',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '50%',
                    background: 'none',
                    border: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.color = 'var(--danger)'}
                  onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  &times;
                </button>
              </div>

              {/* Grid 1: Basic Info & Academic Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', background: 'rgba(0,0,0,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>PROGRAM &amp; SEMESTER</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize' }}>
                    {s.program} (Sem {s.semester})
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>CLASS SECTION CODE</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>
                    {s.class_code || (classObj ? classObj.code : 'N/A')}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>MODULE / SUBJECT</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {subjectObj ? `${subjectObj.name} (${subjectObj.code})` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>INTAKE BATCH</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {classObj ? `${classObj.month} ${classObj.year}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>ASSIGNED LECTURER</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{s.lecturer}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>PERFORMANCE RATING</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{s.score} / 5</span>
                    <span className={`badge ${gradeObj.class}`}>{gradeObj.letter}</span>
                  </div>
                </div>
              </div>

              {/* Survey Responses Section */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                  Questionnaire Feedback
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customQuestions.map(q => {
                    const answer = s.customAnswers ? s.customAnswers[q.id] : null;
                    return (
                      <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {q.label.endsWith('[row]') ? q.label.replace(/\s*\[row\]$/, '').trim() : q.label}
                        </span>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-primary)', 
                          whiteSpace: 'pre-wrap', 
                          lineHeight: '1.5',
                          wordBreak: 'break-word',
                          fontStyle: answer !== undefined && answer !== null ? 'normal' : 'italic'
                        }}>
                          {answer !== undefined && answer !== null ? (
                            Array.isArray(answer) ? answer.join(', ') : answer.toString()
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Not answered</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {customQuestions.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                      No additional custom questionnaire fields were configured at the time of this evaluation submission.
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedSubmissionForModal(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
