import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import KelolaGuru from './pages/admin/KelolaGuru';
import KelolaSiswa from './pages/admin/KelolaSiswa';
import KelolaKelas from './pages/admin/KelolaKelas';
import KelolaMapel from './pages/admin/KelolaMapel';
import AssignSiswa from './pages/admin/AssignSiswa';
import AssignGuru from './pages/admin/AssignGuru';
import AdminRekapNilai from './pages/admin/RekapNilai';

import GuruDashboard from './pages/guru/Dashboard';
import KelolaNilai from './pages/guru/KelolaNilai';
import GuruRekapNilai from './pages/guru/RekapNilai';

import SiswaDashboard from './pages/siswa/Dashboard';
import LihatNilai from './pages/siswa/LihatNilai';

import type { Role } from './types';

function RequireAuth({ children, role }: { children: React.ReactNode; role?: Role }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Memuat...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const dest = user.role === 'admin' ? '/admin' : user.role === 'guru' ? '/guru' : '/siswa';
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'guru') return <Navigate to="/guru" replace />;
  return <Navigate to="/siswa" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/guru" element={<RequireAuth role="admin"><KelolaGuru /></RequireAuth>} />
      <Route path="/admin/siswa" element={<RequireAuth role="admin"><KelolaSiswa /></RequireAuth>} />
      <Route path="/admin/kelas" element={<RequireAuth role="admin"><KelolaKelas /></RequireAuth>} />
      <Route path="/admin/mapel" element={<RequireAuth role="admin"><KelolaMapel /></RequireAuth>} />
      <Route path="/admin/assign-siswa" element={<RequireAuth role="admin"><AssignSiswa /></RequireAuth>} />
      <Route path="/admin/assign-guru" element={<RequireAuth role="admin"><AssignGuru /></RequireAuth>} />
      <Route path="/admin/rekap-nilai" element={<RequireAuth role="admin"><AdminRekapNilai /></RequireAuth>} />

      <Route path="/guru" element={<RequireAuth role="guru"><GuruDashboard /></RequireAuth>} />
      <Route path="/guru/nilai" element={<RequireAuth role="guru"><KelolaNilai /></RequireAuth>} />
      <Route path="/guru/rekap" element={<RequireAuth role="guru"><GuruRekapNilai /></RequireAuth>} />

      <Route path="/siswa" element={<RequireAuth role="siswa"><SiswaDashboard /></RequireAuth>} />
      <Route path="/siswa/nilai" element={<RequireAuth role="siswa"><LihatNilai /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
