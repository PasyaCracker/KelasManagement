import { useEffect, useState } from 'react';
import { Award, BookOpen, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Siswa, KelasSiswa, Kelas, Nilai } from '../../types';

export default function SiswaDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [siswaProfile, setSiswaProfile] = useState<Siswa | null>(null);
  const [kelas, setKelas] = useState<(KelasSiswa & { kelas: Kelas })[]>([]);
  const [nilaiSummary, setNilaiSummary] = useState<{ total: number; avg: number; lulus: number }>({ total: 0, avg: 0, lulus: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: profile } = await supabase.from('siswa').select('*').eq('user_id', user.id).maybeSingle();
      if (!profile) { setLoading(false); return; }
      setSiswaProfile(profile as Siswa);

      const [kelasData, nilaiData] = await Promise.all([
        supabase.from('kelas_siswa').select('*, kelas(*)').eq('siswa_id', profile.id),
        supabase.from('nilai').select('nilai_akhir').eq('siswa_id', profile.id),
      ]);

      setKelas((kelasData.data ?? []) as (KelasSiswa & { kelas: Kelas })[]);

      const nilaiArr = (nilaiData.data ?? []) as Pick<Nilai, 'nilai_akhir'>[];
      const total = nilaiArr.length;
      const avg = total ? nilaiArr.reduce((s, n) => s + (n.nilai_akhir ?? 0), 0) / total : 0;
      const lulus = nilaiArr.filter(n => (n.nilai_akhir ?? 0) >= 75).length;
      setNilaiSummary({ total, avg, lulus });
      setLoading(false);
    }
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <Layout title="Dashboard Siswa" subtitle="Informasi akademik Anda">
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Greeting banner */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 text-white shadow-md mb-6">
            <p className="text-blue-200 text-sm">{greeting()},</p>
            <h2 className="text-2xl font-bold mt-0.5">{siswaProfile?.nama ?? user?.nama}</h2>
            {siswaProfile?.nis && <p className="text-blue-200 text-sm mt-1">NIS: {siswaProfile.nis}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{nilaiSummary.total}</p>
                <p className="text-sm text-gray-500">Mata Pelajaran</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{nilaiSummary.avg.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Rata-rata Nilai</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{nilaiSummary.lulus}/{nilaiSummary.total}</p>
                <p className="text-sm text-gray-500">Mapel Lulus (≥75)</p>
              </div>
            </div>
          </div>

          {/* Kelas info */}
          {kelas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900 text-sm">Kelas Saya</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {kelas.map(k => (
                  <span key={k.id} className="inline-flex items-center gap-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {k.kelas?.nama_kelas} ({k.kelas?.tahun_ajaran})
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/siswa/nilai')}
            className="w-full sm:w-auto flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            <Award className="w-5 h-5" />
            Lihat Nilai Saya
          </button>
        </>
      )}
    </Layout>
  );
}
