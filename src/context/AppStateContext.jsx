import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [formActive, setFormActive] = useState(true);
  const [adminPassword, setAdminPassword] = useState('admin123'); // Default password
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [activeSemesters, setActiveSemesters] = useState({
    foundation: [1, 2],
    degree: [1, 2, 3, 4, 5, 6]
  });

  // Fetch all tables from Supabase on mount
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [
        resLecturers,
        resClasses,
        resSubjects,
        resQuestions,
        resSemesters,
        resSettings,
        resSubmissions
      ] = await Promise.all([
        supabase.from('lecturers').select('*').order('name'),
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*').order('code'),
        supabase.from('custom_questions').select('*').order('created_at'),
        supabase.from('active_semesters').select('*'),
        supabase.from('settings').select('*'),
        supabase.from('submissions').select('*').order('timestamp', { ascending: false })
      ]);

      if (resLecturers.error) throw resLecturers.error;
      if (resClasses.error) throw resClasses.error;
      if (resSubjects.error) throw resSubjects.error;
      if (resQuestions.error) throw resQuestions.error;
      if (resSemesters.error) throw resSemesters.error;
      if (resSettings.error) throw resSettings.error;
      if (resSubmissions.error) throw resSubmissions.error;

      // Set state values
      setLecturers(resLecturers.data || []);
      setSubjects(resSubjects.data || []);
      setCustomQuestions(resQuestions.data || []);

      // Map classes to camelCase local state structure
      const mappedClasses = (resClasses.data || []).map(cls => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        subjectId: cls.subject_id,
        lecturerId: cls.lecturer_id,
        year: cls.year,
        semester: cls.semester
      }));
      setClasses(mappedClasses);

      // Map semesters
      const semMap = { foundation: [1, 2], degree: [1, 2, 3, 4, 5, 6] };
      if (resSemesters.data && resSemesters.data.length > 0) {
        resSemesters.data.forEach(item => {
          semMap[item.program] = item.semesters;
        });
      }
      setActiveSemesters(semMap);

      // Map Settings
      const formActiveRow = resSettings.data?.find(s => s.key === 'formActive');
      if (formActiveRow) {
        setFormActive(formActiveRow.value);
      }

      const passwordRow = resSettings.data?.find(s => s.key === 'adminPassword');
      if (passwordRow) {
        setAdminPassword(passwordRow.value);
      } else {
        // Seed default password in db if missing
        await supabase.from('settings').insert([{ key: 'adminPassword', value: 'admin123' }]);
      }

      // Map submissions to local structure
      const mappedSubmissions = (resSubmissions.data || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        program: s.program,
        semester: s.semester,
        classId: s.class_id,
        subjectId: s.subject_id,
        score: s.score,
        lecturer: s.lecturer,
        timestamp: s.timestamp,
        customAnswers: s.custom_answers
      }));
      setSubmissions(mappedSubmissions);
      setFetchError(null);
    } catch (err) {
      console.error("Supabase Database load error:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update Settings (Form Active Status)
  const toggleFormActive = async (val) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: val })
        .eq('key', 'formActive');
      if (error) throw error;
      setFormActive(val);
    } catch (err) {
      console.error("Error toggling portal status:", err);
      alert("Database error: " + err.message);
    }
  };

  // Update Settings (Admin Password)
  const updateAdminPassword = async (newPwd) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: newPwd })
        .eq('key', 'adminPassword');
      if (error) throw error;
      setAdminPassword(newPwd);
    } catch (err) {
      console.error("Error updating admin password:", err);
      alert("Database error: " + err.message);
    }
  };

  // CRUD for Lecturers
  const addLecturer = async (name) => {
    try {
      const trimmed = name.trim();
      const existing = lecturers.find(l => l.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;

      const { data, error } = await supabase.from('lecturers').insert([{ name: trimmed }]).select();
      if (error) throw error;

      const newL = data[0];
      setLecturers(prev => [...prev, newL].sort((a, b) => a.name.localeCompare(b.name)));
      return newL;
    } catch (err) {
      console.error("Error adding lecturer:", err);
      alert("Database error: " + err.message);
      return null;
    }
  };

  const updateLecturer = async (updatedL) => {
    try {
      const { error } = await supabase
        .from('lecturers')
        .update({ name: updatedL.name.trim() })
        .eq('id', updatedL.id);
      if (error) throw error;
      setLecturers(prev => prev.map(l => l.id === updatedL.id ? updatedL : l).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("Error updating lecturer:", err);
      alert("Database error: " + err.message);
    }
  };

  const deleteLecturer = async (id) => {
    try {
      const { error } = await supabase.from('lecturers').delete().eq('id', id);
      if (error) throw error;
      setLecturers(prev => prev.filter(l => l.id !== id));
      // Cascade deletions in classes referencing it
      setClasses(prev => prev.filter(c => c.lecturerId !== id));
    } catch (err) {
      console.error("Error deleting lecturer:", err);
      alert("Database error: " + err.message);
    }
  };

  // Helper to ensure lecturer exists, returns their ID
  const ensureLecturerExists = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    
    // Check local state
    const existing = lecturers.find(l => l.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    // Insert new to database
    const newL = await addLecturer(trimmed);
    return newL ? newL.id : null;
  };

  // CRUD for Classes
  const addClass = async (cls) => {
    try {
      const dbCls = {
        name: cls.name,
        code: cls.code,
        subject_id: cls.subjectId,
        lecturer_id: cls.lecturerId,
        year: cls.year,
        semester: cls.semester
      };
      const { data, error } = await supabase.from('classes').insert([dbCls]).select();
      if (error) throw error;

      const localCls = data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        subjectId: item.subject_id,
        lecturerId: item.lecturer_id,
        year: item.year,
        semester: item.semester
      }));
      setClasses(prev => [...prev, ...localCls]);
    } catch (err) {
      console.error("Error creating class:", err);
      alert("Database error: " + err.message);
    }
  };

  const updateClass = async (cls) => {
    try {
      const dbCls = {
        name: cls.name,
        code: cls.code,
        subject_id: cls.subjectId,
        lecturer_id: cls.lecturerId,
        year: cls.year,
        semester: cls.semester
      };
      const { error } = await supabase.from('classes').update(dbCls).eq('id', cls.id);
      if (error) throw error;
      
      setClasses(prev => prev.map(item => item.id === cls.id ? cls : item));
    } catch (err) {
      console.error("Error updating class:", err);
      alert("Database error: " + err.message);
    }
  };

  const deleteClass = async (id) => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      setClasses(prev => prev.filter(cls => cls.id !== id));
      setSubmissions(prev => prev.filter(subm => subm.classId !== id));
    } catch (err) {
      console.error("Error deleting class:", err);
      alert("Database error: " + err.message);
    }
  };

  // CRUD for Subjects
  const addSubject = async (sub) => {
    try {
      const { data, error } = await supabase.from('subjects').insert([sub]).select();
      if (error) throw error;
      setSubjects(prev => [...prev, ...data]);
    } catch (err) {
      console.error("Error creating subject:", err);
      alert("Database error: " + err.message);
    }
  };

  const updateSubject = async (updatedSub) => {
    try {
      const { error } = await supabase.from('subjects').update(updatedSub).eq('id', updatedSub.id);
      if (error) throw error;
      setSubjects(prev => prev.map(sub => sub.id === updatedSub.id ? updatedSub : sub));
    } catch (err) {
      console.error("Error updating subject:", err);
      alert("Database error: " + err.message);
    }
  };

  const deleteSubject = async (id) => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(prev => prev.filter(sub => sub.id !== id));
      setSubmissions(prev => prev.filter(subm => subm.subjectId !== id));
      // Cascade delete to classes using this subject
      setClasses(prev => prev.filter(cls => cls.subjectId !== id));
    } catch (err) {
      console.error("Error deleting subject:", err);
      alert("Database error: " + err.message);
    }
  };

  // CRUD for Custom Questions
  const addQuestion = async (q) => {
    try {
      const { data, error } = await supabase.from('custom_questions').insert([q]).select();
      if (error) throw error;
      setCustomQuestions(prev => [...prev, ...data]);
    } catch (err) {
      console.error("Error creating form question:", err);
      alert("Database error: " + err.message);
    }
  };

  const updateQuestion = async (updatedQ) => {
    try {
      const { error } = await supabase.from('custom_questions').update(updatedQ).eq('id', updatedQ.id);
      if (error) throw error;
      setCustomQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    } catch (err) {
      console.error("Error updating question:", err);
      alert("Database error: " + err.message);
    }
  };

  const deleteQuestion = async (id) => {
    try {
      const { error } = await supabase.from('custom_questions').delete().eq('id', id);
      if (error) throw error;
      setCustomQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error("Error deleting question:", err);
      alert("Database error: " + err.message);
    }
  };

  // Toggle semesters active
  const toggleSemesterActive = async (program, semNum) => {
    try {
      const currentList = activeSemesters[program] || [];
      const updatedList = currentList.includes(semNum)
        ? currentList.filter(s => s !== semNum)
        : [...currentList, semNum].sort((a, b) => a - b);

      const { error } = await supabase
        .from('active_semesters')
        .update({ semesters: updatedList })
        .eq('program', program);
        
      if (error) throw error;

      setActiveSemesters(prev => ({
        ...prev,
        [program]: updatedList
      }));
    } catch (err) {
      console.error("Error updating active semesters:", err);
      alert("Database error: " + err.message);
    }
  };

  // Submissions
  const addSubmission = async (subm) => {
    try {
      const dbSubm = {
        name: subm.name,
        email: subm.email,
        phone: subm.phone,
        program: subm.program,
        semester: subm.semester,
        class_id: subm.classId,
        subject_id: subm.subjectId,
        score: subm.score,
        lecturer: subm.lecturer,
        custom_answers: subm.customAnswers || {}
      };

      const { data, error } = await supabase.from('submissions').insert([dbSubm]).select();
      if (error) throw error;

      const localS = data.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        program: s.program,
        semester: s.semester,
        classId: s.class_id,
        subjectId: s.subject_id,
        score: s.score,
        lecturer: s.lecturer,
        timestamp: s.timestamp,
        customAnswers: s.custom_answers
      }))[0];

      setSubmissions(prev => [localS, ...prev]);
    } catch (err) {
      console.error("Error registering student performance:", err);
      alert("Database error: " + err.message);
    }
  };

  const deleteSubmission = async (id) => {
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (error) throw error;
      setSubmissions(prev => prev.filter(subm => subm.id !== id));
    } catch (err) {
      console.error("Error deleting student record:", err);
      alert("Database error: " + err.message);
    }
  };

  // Academic subject logic filtering
  const getSubjectsBySemester = (semester) => {
    if (!semester) return [];
    const semNum = parseInt(semester, 10);
    return subjects.filter(sub => parseInt(sub.semester, 10) === semNum);
  };

  return (
    <AppStateContext.Provider value={{
      loading,
      fetchError,
      formActive,
      setFormActive: toggleFormActive,
      adminPassword,
      updateAdminPassword,
      lecturers,
      addLecturer,
      updateLecturer,
      deleteLecturer,
      ensureLecturerExists,
      classes,
      addClass,
      updateClass,
      deleteClass,
      subjects,
      addSubject,
      updateSubject,
      deleteSubject,
      submissions,
      addSubmission,
      deleteSubmission,
      getSubjectsBySemester,
      
      customQuestions,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      
      activeSemesters,
      toggleSemesterActive
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
