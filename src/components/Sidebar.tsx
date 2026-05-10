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
  section?: string;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, section: 'Utama' },
  { to: '/admin/guru', label: 'Data Guru', icon: <PenLine className="w-[18px] h-[18px]" />, section: 'Manajemen Data' },
  { to: '/admin/siswa', label: 'Data Siswa', icon: <GraduationCap className="w-[18px] h-[18px]" /> },
  { to: '/admin/kelas', label: 'Data Kelas', icon: <School className="w-[18px] h-[18px]" /> },
  { to: '/admin/mapel', label: 'Mata Pelajaran', icon: <BookOpen className="w-[18px] h-[18px]" /> },
  { to: '/admin/assign-siswa', label: 'Siswa ke Kelas', icon: <UserPlus className="w-[18px] h-[18px]" />, section: 'Penugasan' },
  { to: '/admin/assign-guru', label: 'Guru Pengajar', icon: <Users className="w-[18px] h-[18px]" /> },
  { to: '/admin/rekap-nilai', label: 'Rekap Nilai', icon: <BarChart2 className="w-[18px] h-[18px]" />, section: 'Laporan' },
];

const guruNav: NavItem[] = [
  { to: '/guru', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, section: 'Utama' },
  { to: '/guru/nilai', label: 'Kelola Nilai', icon: <ClipboardList className="w-[18px] h-[18px]" />, section: 'Akademik' },
  { to: '/guru/rekap', label: 'Rekap Nilai', icon: <FileText className="w-[18px] h-[18px]" /> },
];

const siswaNav: NavItem[] = [
  { to: '/siswa', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, section: 'Utama' },
  { to: '/siswa/nilai', label: 'Nilai Saya', icon: <Award className="w-[18px] h-[18px]" />, section: 'Akademik' },
];

const navMap = { admin: adminNav, guru: guruNav, siswa: siswaNav };

const roleConfig = {
  admin: { label: 'Administrator', color: 'bg-brand-100 text-brand-700' },
  guru: { label: 'Guru', color: 'bg-emerald-100 text-emerald-700' },
  siswa: { label: 'Siswa', color: 'bg-amber-100 text-amber-700' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user ? navMap[user.role] : [];
  const roleCfg = user ? roleConfig[user.role] : { label: '', color: '' };

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
          <BookMarked className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Sistem Akademik</p>
          <p className="text-surface-500 text-[11px] mt-0.5">SMA / SMK</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="bg-white/[0.06] rounded-xl px-3.5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 text-sm font-bold flex-shrink-0">
              {user?.nama?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.nama}</p>
              <span className={`inline-block mt-1 text-[11px] font-semibold rounded-md px-1.5 py-0.5 ${roleCfg.color}`}>
                {roleCfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {(() => {
          let lastSection = '';
          return navItems.map(item => {
            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;
            return (
              <div key={item.to}>
                {showSection && (
                  <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-3 mt-4 mb-2 first:mt-0">
                    {item.section}
                  </p>
                )}
                <NavLink
                  to={item.to}
                  end={item.to === '/admin' || item.to === '/guru' || item.to === '/siswa'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 mb-0.5 ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'text-surface-400 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </div>
            );
          });
        })()}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-surface-500 hover:bg-white/[0.06] hover:text-white transition-all duration-150"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-surface-900 rounded-xl flex items-center justify-center shadow-elevated border border-white/10"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 z-10 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </div>

      <div className="hidden lg:flex w-[260px] flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </div>
    </>
  );
}
