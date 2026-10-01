import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminTimetableManagement } from './pages/AdminTimetableManagement';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherMarksView } from './pages/TeacherMarksView';
import { TeacherTimetable } from './pages/TeacherTimetable';
import { StudentDashboard } from './pages/StudentDashboard';
import { connectSocket } from './services/socket';

export const App: React.FC = () => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connectSocket(token);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/timetable" element={<AdminTimetableManagement />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/marks/add" element={<TeacherDashboard />} />
        <Route path="/teacher/marks/view" element={<TeacherMarksView />} />
        <Route path="/teacher/timetable" element={<TeacherTimetable />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;