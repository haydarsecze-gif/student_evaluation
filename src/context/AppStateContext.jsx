import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [formActive, setFormActive] = useState(true);
  const [adminPassword, setAdminPassword] = useState('admin123'); // Default password
  const [classes, setClasses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [lecturerAssignments, setLecturerAssignments] = useState([]);
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
        resClasses,
        resAssignments,
        resQuestions,
        resSemesters,
        resSettings,
        resSubmissions
      ] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('lecturer_assignments').select('*'),
        supabase.from('custom_questions').select('*').order('created_at'),
        supabase.from('active_semesters').select('*'),
        supabase.from('settings').select('*'),
        supabase.from('submissions').select('*').order('timestamp', { ascending: false })
      ]);

      if (resClasses.error) throw resClasses.error;
      if (resAssignments.error) throw resAssignments.error;
      if (resQuestions.error) throw resQuestions.error;
      if (resSemesters.error) throw resSemesters.error;
      if (resSettings.error) throw resSettings.error;
      if (resSubmissions.error) throw resSubmissions.error;

      // Set values
      setClasses(resClasses.data || []);
      setCustomQuestions(resQuestions.data || []);
      
      // Map assignments to local camelCase structure
      const mappedAssignments = (resAssignments.data || []).map(la => ({
        id: la.id,
        lecturerName: la.lecturer_name,
        classId: la.class_id,
        semester: la.semester
      }));
      setLecturerAssignments(mappedAssignments);

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

  // CRUD for Classes (representing Class/Subject combined model)
  const addClass = async (cls) => {
    try {
      const { data, error } = await supabase.from('classes').insert([cls]).select();
      if (error) throw error;
      setClasses(prev => [...prev, ...data]);
    } catch (err) {
      console.error("Error creating class:", err);
      alert("Database error: " + err.message);
    }
  };

  const updateClass = async (updatedCls) => {
    try {
      const { error } = await supabase.from('classes').update(updatedCls).eq('id', updatedCls.id);
      if (error) throw error;
      setClasses(prev => prev.map(cls => cls.id === updatedCls.id ? updatedCls : cls));
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
      setLecturerAssignments(prev => prev.filter(la => la.classId !== id));
    } catch (err) {
      console.error("Error deleting class:", err);
      alert("Database error: " + err.message);
    }
  };

  // CRUD for Lecturer Assignments
  const addLecturerAssignment = async (la) => {
    try {
      const dbLa = {
        lecturer_name: la.lecturerName,
        class_id: la.classId,
        semester: la.semester
      };
      const { data, error } = await supabase.from('lecturer_assignments').insert([dbLa]).select();
      if (error) throw error;
      
      const localLa = data.map(item => ({
        id: item.id,
        lecturerName: item.lecturer_name,
        classId: item.class_id,
        semester: item.semester
      }));
      setLecturerAssignments(prev => [...prev, ...localLa]);
    } catch (err) {
      console.error("Error adding lecturer assignment:", err);
      alert("Database error: " + err.message);
    }
  };

  const deleteLecturerAssignment = async (id) => {
    try {
      const { error } = await supabase.from('lecturer_assignments').delete().eq('id', id);
      if (error) throw error;
      setLecturerAssignments(prev => prev.filter(la => la.id !== id));
    } catch (err) {
      console.error("Error removing lecturer assignment:", err);
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

  // Smart lecturer selector mapping
  const getLecturersForConfig = (classId, semester) => {
    if (!classId || !semester) return [];
    const semNum = parseInt(semester, 10);
    return lecturerAssignments.filter(la => 
      la.classId === classId && 
      parseInt(la.semester, 10) === semNum
    );
  };

  return (
    <AppStateContext.Provider value={{
      loading,
      fetchError,
      formActive,
      setFormActive: toggleFormActive,
      adminPassword,
      updateAdminPassword,
      classes,
      addClass,
      updateClass,
      deleteClass,
      submissions,
      addSubmission,
      deleteSubmission,
      
      // Lecturer Assignments
      lecturerAssignments,
      addLecturerAssignment,
      deleteLecturerAssignment,
      getLecturersForConfig,
      
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
