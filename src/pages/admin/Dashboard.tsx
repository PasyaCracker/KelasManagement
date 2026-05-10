import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Sparkles,
  UserPlus,
  ClipboardList,
  BookMarked,
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const quickLinks = [
  {
    icon: <UserPlus className="w-4 h-4" />,
    label: 'Kelola Data Guru',
    description: 'Tambah & edit data pengajar',
    href: '/admin/kelola-guru',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    icon: <GraduationCap className="w-4 h-4" />,
    label: 'Kelola Data Siswa',
    description: 'Tambah & edit data pelajar',
    href: '/admin/kelola-siswa',
    color: 'text-success-600',
    bg: 'bg-success-50',
  },
  {
    icon: <BookMarked className="w-4 h-4" />,
    label: 'Siswa ke Kelas',
    description: 'Atur anggota kelas',
    href: '/admin/assign-siswa',
    color: 'text-warning-600',
    bg: 'bg-warning-50',
  },
  {
    icon: <ClipboardList className="w-4 h-4" />,
    label: 'Rekap Nilai',
    description: 'Lihat ringkasan nilai',
    href: '/admin/rekap-nilai',
    color: 'text-danger-600',
    bg: 'bg-danger-50',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ guru: 0, siswa: 0, kelas: 0, mapel: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [g, s, k, m] = await Promise.all([
        supabase.from('guru').select('id', { count: 'exact', head: true }),
        supabase.from('siswa').select('id', { count: 'exact', head: true }),
        supabase.from('kelas').select('id', { count: 'exact', head: true }),
        supabase.from('mapel').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        guru: g.count ?? 0,
        siswa: s.count ?? 0,
        kelas: k.count ?? 0,
        mapel: m.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Guru', value: stats.guru, icon: <Users className="w-6 h-6" />, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total Siswa', value: stats.siswa, icon: <GraduationCap className="w-6 h-6" />, color: 'text-success-600', bg: 'bg-success-50' },
    { label: 'Total Kelas', value: stats.kelas, icon: <School className="w-6 h-6" />, color: 'text-warning-600', bg: 'bg-warning-50' },
    { label: 'Total Mapel', value: stats.mapel, icon: <BookOpen className="w-6 h-6" />, color: 'text-danger-600', bg: 'bg-danger-50' },
  ];

  return (
    <Layout title="Dashboard" subtitle="Selamat datang di Sistem Akademik">
      {/* Welcome Banner */}
      <div className="card p-0 mb-6 overflow-hidden animate-fade-in">
        <div className="relative bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-8 text-white">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-brand-200 text-sm font-medium">Selamat datang kembali,</p>
              <h2 className="text-xl font-bold mt-0.5">{user?.nama}</h2>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 text-brand-200 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Panel Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-3.5 bg-surface-100 rounded-md w-20" />
                  <div className="h-7 bg-surface-100 rounded-md w-12" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-surface-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          {cards.map(c => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-sm font-semibold text-surface-900 mb-3">Akses Cepat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="card-hover group p-4 flex items-center gap-3.5 no-underline"
            >
              <div className={`w-9 h-9 rounded-lg ${link.bg} flex items-center justify-center flex-shrink-0 ${link.color}`}>
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 group-hover:text-brand-700 transition-colors truncate">
                  {link.label}
                </p>
                <p className="text-xs text-surface-400 mt-0.5 truncate">{link.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Guide Card */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Panduan Penggunaan</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Tambah data guru dan siswa melalui menu Data Guru / Data Siswa', color: 'bg-brand-500' },
              { step: '2', text: 'Buat kelas dan mata pelajaran terlebih dahulu', color: 'bg-success-500' },
              { step: '3', text: 'Masukkan siswa ke kelas melalui menu Siswa ke Kelas', color: 'bg-warning-500' },
              { step: '4', text: 'Tetapkan guru pengajar melalui menu Guru Pengajar', color: 'bg-danger-500' },
              { step: '5', text: 'Pantau rekap nilai seluruh kelas di menu Rekap Nilai', color: 'bg-surface-400' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-md ${item.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {item.step}
                </span>
                <p className="text-sm text-surface-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
