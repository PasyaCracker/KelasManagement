import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, School,
  UserPlus, BarChart2, LogOut, BookMarked,
  ClipboardList, FileText, Menu, X, Award, PenLine
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/admin/guru', label: 'Data Guru', icon: <PenLine className="w-5 h-5" /> },
  { to: '/admin/siswa', label: 'Data Siswa', icon: <GraduationCap className="w-5 h-5" /> },
  { to: '/admin/kelas', label: 'Data Kelas', icon: <School className="w-5 h-5" /> },
  { to: '/admin/mapel', label: 'Mata Pelajaran', icon: <BookOpen className="w-5 h-5" /> },
  { to: '/admin/assign-siswa', label: 'Siswa ke Kelas', icon: <UserPlus className="w-5 h-5" /> },
  { to: '/admin/assign-guru', label: 'Guru Pengajar', icon: <Users className="w-5 h-5" /> },
  { to: '/admin/rekap-nilai', label: 'Rekap Nilai', icon: <BarChart2 className="w-5 h-5" /> },
];

const guruNav: NavItem[] = [
  { to: '/guru', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/guru/nilai', label: 'Kelola Nilai', icon: <ClipboardList className="w-5 h-5" /> },
  { to: '/guru/rekap', label: 'Rekap Nilai', icon: <FileText className="w-5 h-5" /> },
];

const siswaNav: NavItem[] = [
  { to: '/siswa', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/siswa/nilai', label: 'Nilai Saya', icon: <Award className="w-5 h-5" /> },
];

const navMap = { admin: adminNav, guru: guruNav, siswa: siswaNav };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user ? navMap[user.role] : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = { admin: 'Administrator', guru: 'Guru', siswa: 'Siswa' };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-700/30">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
          <BookMarked className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">SMA/SMK</p>
          <p className="text-blue-200 text-xs">Sistem Akademik</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-blue-700/30">
        <div className="bg-white/10 rounded-lg px-3 py-3">
          <p className="text-white font-semibold text-sm truncate">{user?.nama}</p>
          <span className="inline-block mt-1 text-xs font-medium bg-white/20 text-blue-100 rounded-full px-2 py-0.5">
            {user ? roleLabel[user.role] : ''}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/admin' || item.to === '/guru' || item.to === '/siswa'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-800 to-blue-900 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-gradient-to-b from-blue-800 to-blue-900 shadow-xl z-30">
        <SidebarContent />
      </div>
    </>
  );
}
