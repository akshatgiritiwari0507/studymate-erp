import React from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePageTracker } from './hooks/usePageTracker';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './pages/AdminDashboard';
import AdminRole from './pages/AdminRole';
import AdminPasswordReset from './pages/AdminPasswordReset';
import AdminEvents from './pages/AdminEvents';
import AdminBus from './pages/AdminBus';
import AdminNotice from './pages/AdminNotice';
import AdminLostFound from './pages/AdminLostFound';
import AdminCoursesV2 from './pages/AdminCoursesV2';
import AdminSectionsV2 from './pages/AdminSectionsV2';
import AdminCoursesSections from './pages/AdminCoursesSections';
import AdminTeachers from './pages/AdminTeachers';
import AdminTeacherAccounts from './pages/AdminTeacherAccounts';
import Teacher from './pages/Teacher';
import TeacherSidebar from './components/TeacherSidebar';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherSections from './pages/TeacherSections';
import TeacherSectionDetail from './pages/TeacherSectionDetail';
import TeacherAssignBySection from './pages/TeacherAssignBySection';
import TeacherAttendanceBySection from './pages/TeacherAttendanceBySection';
import TeacherLostFound from './pages/TeacherLostFound';
import TeacherNotice from './pages/TeacherNotice';
import TeacherAbout from './pages/TeacherAbout';
import TeacherChangePassword from './pages/TeacherChangePassword';
import TeacherTimetable from './pages/TeacherTimetable';
import TeacherTodo from './pages/TeacherTodo';
import Student from './pages/Student';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import StudentAbout from './pages/StudentAbout';
import StudentChangePassword from './pages/StudentChangePassword';
import StudentTimetable from './pages/StudentTimetable';
import StudentTodo from './pages/StudentTodo';
import StudentAssignments from './pages/StudentAssignments';
import StudentNotice from './pages/StudentNotice';
import StudentAttendance from './pages/StudentAttendance';
import StudentLostFound from './pages/StudentLostFound';
import StudentEvents from './pages/StudentEvents';
import StudentBusRoutes from './pages/StudentBusRoutes';

function StudentLayout() {
  return (
    <Layout>
      <Sidebar role="student" />
      <div style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </div>
    </Layout>
  );
}

function AdminLayout() {
  return (
    <Layout>
      <AdminSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </div>
    </Layout>
  );
}

function TeacherLayout() {
  return (
    <Layout>
      <TeacherSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </div>
    </Layout>
  );
}

function Protected({ roles, children }) {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

function Landing() {
  const { token, role } = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!token) return;
    
    // Check if there's a saved last page
    const lastPage = localStorage.getItem('lastPage');
    if (lastPage) {
      // Clear the saved page and navigate to it
      localStorage.removeItem('lastPage');
      navigate(lastPage, { replace: true });
      return;
    }
    
    // Default navigation based on role
    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'teacher') navigate('/teacher', { replace: true });
    else navigate('/student', { replace: true });
  }, [token, role, navigate]);
  return <Navigate to="/login" replace />;
}

export default function App() {
  // Track page changes for session persistence
  usePageTracker();
  
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Protected roles={["admin"]}><AdminLayout /></Protected>}>
          <Route index element={<AdminDashboard />} />
          <Route path="role" element={<AdminRole />} />
          <Route path="password-reset" element={<AdminPasswordReset />} />
          <Route path="courses-v2" element={<AdminCoursesV2 />} />
          <Route path="sections-v2" element={<AdminSectionsV2 />} />
          <Route path="courses-sections" element={<AdminCoursesSections />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="teacher-accounts" element={<AdminTeacherAccounts />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="bus" element={<AdminBus />} />
          <Route path="notice" element={<AdminNotice />} />
          <Route path="lost-found" element={<AdminLostFound />} />
        </Route>
        <Route path="/teacher" element={<Protected roles={["teacher"]}><TeacherLayout /></Protected>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="sections" element={<TeacherSections />} />
          <Route path="sections/:id" element={<TeacherSectionDetail />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="todo" element={<TeacherTodo />} />
          <Route path="assign-by-section" element={<TeacherAssignBySection />} />
          <Route path="attendance-by-section" element={<TeacherAttendanceBySection />} />
          <Route path="lost-found" element={<TeacherLostFound />} />
          <Route path="notice" element={<TeacherNotice />} />
          <Route path="about" element={<TeacherAbout />} />
          <Route path="change-password" element={<TeacherChangePassword />} />
        </Route>
        <Route path="/student" element={<Protected roles={["student"]}><StudentLayout /></Protected>}>
          <Route index element={<Student />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="todo" element={<StudentTodo />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="notice" element={<StudentNotice />} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="bus-routes" element={<StudentBusRoutes />} />
          <Route path="lost-found" element={<StudentLostFound />} />
          <Route path="about" element={<StudentAbout />} />
          <Route path="change-password" element={<StudentChangePassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
