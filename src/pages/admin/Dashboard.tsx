import { useEffect, useState } from 'react';
import { Users, GraduationCap, School, BookOpen, TrendingUp } from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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
    { label: 'Total Guru', value: stats.guru, icon: <Users className="w-7 h-7" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Siswa', value: stats.siswa, icon: <GraduationCap className="w-7 h-7" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Kelas', value: stats.kelas, icon: <School className="w-7 h-7" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Mapel', value: stats.mapel, icon: <BookOpen className="w-7 h-7" />, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <Layout title="Dashboard" subtitle="Selamat datang di Sistem Akademik">
      <div className="mb-6 bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 opacity-80" />
          <div>
            <p className="text-blue-100 text-sm">Selamat datang,</p>
            <h2 className="text-xl font-bold">{user?.nama}</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-24 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Panduan Cepat</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />Tambah data guru dan siswa melalui menu Data Guru / Data Siswa</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />Buat kelas dan mata pelajaran terlebih dahulu</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />Masukkan siswa ke kelas melalui menu Siswa ke Kelas</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />Tetapkan guru pengajar melalui menu Guru Pengajar</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />Pantau rekap nilai seluruh kelas di menu Rekap Nilai</li>
        </ul>
      </div>
    </Layout>
  );
}
