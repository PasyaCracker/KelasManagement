import { useEffect, useState } from 'react';
import { BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { GuruMapelKelas, Guru, Mapel, Kelas } from '../../types';

interface Assignment extends GuruMapelKelas {
  guru: Guru;
  mapel: Mapel;
  kelas: Kelas;
  siswaCount?: number;
}

export default function GuruDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const totalKelas = new Set(assignments.map(a => a.kelas_id)).size;
  const totalSiswa = assignments.reduce((sum, a) => sum + (a.siswaCount ?? 0), 0);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: guruData } = await supabase.from('guru').select('id').eq('user_id', user.id).maybeSingle();
      if (!guruData) { setLoading(false); return; }

      const { data } = await supabase
        .from('guru_mapel_kelas')
        .select('*, guru(*), mapel(*), kelas(*)')
        .eq('guru_id', guruData.id);

      const asgn = (data ?? []) as Assignment[];

      const kelasIds = [...new Set(asgn.map(a => a.kelas_id))];
      const counts = await Promise.all(
        kelasIds.map(id => supabase.from('kelas_siswa').select('id', { count: 'exact', head: true }).eq('kelas_id', id))
      );
      const countMap = Object.fromEntries(kelasIds.map((id, i) => [id, counts[i].count ?? 0]));
      setAssignments(asgn.map(a => ({ ...a, siswaCount: countMap[a.kelas_id] })));
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <Layout title="Dashboard Guru" subtitle={`Selamat datang, ${user?.nama}`}>
      <div className="space-y-8 animate-fade-in">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-brand-200 text-sm font-medium">Tahun Ajaran Aktif</p>
              <h2 className="text-xl lg:text-2xl font-bold text-white mt-0.5">Kelas & Mata Pelajaran Saya</h2>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-3.5 bg-surface-100 rounded w-20" />
                    <div className="h-7 bg-surface-100 rounded w-12" />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-100" />
                </div>
              </div>
            ))}
          </div>
        ) : assignments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
            <StatCard
              label="Mata Pelajaran"
              value={assignments.length}
              icon={<BookOpen className="w-5 h-5" />}
              color="text-brand-600"
              bg="bg-brand-50"
            />
            <StatCard
              label="Kelas Diajar"
              value={totalKelas}
              icon={<GraduationCap className="w-5 h-5" />}
              color="text-success-600"
              bg="bg-success-50"
            />
            <StatCard
              label="Total Siswa"
              value={totalSiswa}
              icon={<Users className="w-5 h-5" />}
              color="text-warning-600"
              bg="bg-warning-50"
            />
          </div>
        )}

        {/* Assignment cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 h-40 animate-pulse">
                <div className="h-4 bg-surface-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-surface-50 rounded w-1/2 mb-6" />
                <div className="h-3 bg-surface-50 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState message="Belum ada kelas yang diajarkan" description="Hubungi admin untuk mendapatkan penugasan mengajar" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
            {assignments.map(a => (
              <button
                key={a.id}
                onClick={() => navigate('/guru/nilai')}
                className="card-hover p-6 text-left group rounded-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors duration-200">
                    <BookOpen className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="badge bg-success-50 text-success-700">
                    {a.kelas?.tahun_ajaran}
                  </span>
                </div>
                <h3 className="font-semibold text-surface-900 mb-1">{a.mapel?.nama_mapel}</h3>
                <p className="text-sm text-brand-600 font-medium">{a.kelas?.nama_kelas}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
                  <div className="flex items-center gap-1.5 text-xs text-surface-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{a.siswaCount} siswa terdaftar</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
