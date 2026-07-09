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

  // State-driven Custom Dialog Modal Config
  const [dialog, setDialog] = useState(null); // { message, title, onConfirm, onCancel, confirmText, cancelText }

  // Expose async showConfirm
  const showConfirm = (message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      setDialog({
        message,
        title,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        },
        confirmText: 'Yes',
        cancelText: 'No'
      });
    });
  };

  // Expose async showAlert
  const showAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => {
      setDialog({
        message,
        title,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        confirmText: 'OK',
        cancelText: null
      });
    });
  };

  // Fetch all tables from Supabase on mount
  const fetchAllData = async () => {
    try {
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
        lecturerIds: cls.lecturer_ids || [], // support multiple lecturers via UUID array
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
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAllData();
      setLoading(false);
    };
    init();
  }, []);

  // Update Settings (Form Active Status)
  const toggleFormActive = async (val) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: val })
        .eq('key', 'formActive');
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error toggling portal status:", err);
      showAlert("Database error: " + err.message);
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
      await fetchAllData();
    } catch (err) {
      console.error("Error updating admin password:", err);
      showAlert("Database error: " + err.message);
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

      await fetchAllData();
      return data[0];
    } catch (err) {
      console.error("Error adding lecturer:", err);
      showAlert("Database error: " + err.message);
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
      await fetchAllData();
    } catch (err) {
      console.error("Error updating lecturer:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const deleteLecturer = async (id) => {
    try {
      const { error } = await supabase.from('lecturers').delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting lecturer:", err);
      showAlert("Database error: " + err.message);
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
        lecturer_ids: cls.lecturerIds || [],
        year: cls.year,
        semester: cls.semester
      };
      const { error } = await supabase.from('classes').insert([dbCls]);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error creating class:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const updateClass = async (cls) => {
    try {
      const dbCls = {
        name: cls.name,
        code: cls.code,
        subject_id: cls.subjectId,
        lecturer_ids: cls.lecturerIds || [],
        year: cls.year,
        semester: cls.semester
      };
      const { error } = await supabase.from('classes').update(dbCls).eq('id', cls.id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error updating class:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const deleteClass = async (id) => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting class:", err);
      showAlert("Database error: " + err.message);
    }
  };

  // CRUD for Subjects
  const addSubject = async (sub) => {
    try {
      const { error } = await supabase.from('subjects').insert([sub]);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error creating subject:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const updateSubject = async (updatedSub) => {
    try {
      const { error } = await supabase.from('subjects').update(updatedSub).eq('id', updatedSub.id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error updating subject:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const deleteSubject = async (id) => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting subject:", err);
      showAlert("Database error: " + err.message);
    }
  };

  // CRUD for Custom Questions
  const addQuestion = async (q) => {
    try {
      const { error } = await supabase.from('custom_questions').insert([q]);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error creating form question:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const updateQuestion = async (updatedQ) => {
    try {
      const { error } = await supabase.from('custom_questions').update(updatedQ).eq('id', updatedQ.id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error updating question:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const deleteQuestion = async (id) => {
    try {
      const { error } = await supabase.from('custom_questions').delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting question:", err);
      showAlert("Database error: " + err.message);
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
      await fetchAllData();
    } catch (err) {
      console.error("Error updating active semesters:", err);
      showAlert("Database error: " + err.message);
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

      const { error } = await supabase.from('submissions').insert([dbSubm]);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error registering student performance:", err);
      showAlert("Database error: " + err.message);
    }
  };

  const deleteSubmission = async (id) => {
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting student record:", err);
      showAlert("Database error: " + err.message);
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
      toggleSemesterActive,

      // Custom dialog system
      dialog,
      showAlert,
      showConfirm
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
