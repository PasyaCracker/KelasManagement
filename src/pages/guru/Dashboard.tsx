import { useEffect, useState } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
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

      // Get student counts per class
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
      <div className="mb-6 bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 opacity-80" />
          <div>
            <p className="text-blue-100 text-sm">Tahun Ajaran Aktif</p>
            <h2 className="text-xl font-bold">Kelas & Mata Pelajaran Saya</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-32 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState message="Belum ada kelas yang diajarkan" description="Hubungi admin untuk mendapatkan penugasan mengajar" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map(a => (
            <button
              key={a.id}
              onClick={() => navigate('/guru/nilai')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:border-blue-300 hover:shadow-md transition-all duration-150 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                  {a.kelas?.tahun_ajaran}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{a.mapel?.nama_mapel}</h3>
              <p className="text-sm text-blue-600 font-medium">{a.kelas?.nama_kelas}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>{a.siswaCount} siswa terdaftar</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
