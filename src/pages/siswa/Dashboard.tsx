import { useEffect, useState } from 'react';
import { Award, BookOpen, TrendingUp, Users, ArrowRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
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

  const lulusRate = nilaiSummary.total
    ? Math.round((nilaiSummary.lulus / nilaiSummary.total) * 100)
    : 0;

  return (
    <Layout title="Dashboard Siswa" subtitle="Informasi akademik Anda">
      {loading ? (
        <div className="space-y-6 animate-fade-in">
          <div className="h-32 rounded-xl bg-surface-100 animate-pulse" />
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
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Greeting banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="relative">
              <p className="text-brand-200 text-sm font-medium">{greeting()},</p>
              <h2 className="text-2xl font-bold text-white mt-0.5">{siswaProfile?.nama ?? user?.nama}</h2>
              {siswaProfile?.nis && (
                <p className="text-brand-200 text-sm mt-1">NIS: {siswaProfile.nis}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
            <StatCard
              label="Mata Pelajaran"
              value={nilaiSummary.total}
              icon={<BookOpen className="w-5 h-5" />}
              color="text-brand-600"
              bg="bg-brand-50"
            />
            <StatCard
              label="Rata-rata Nilai"
              value={nilaiSummary.avg.toFixed(1)}
              icon={<TrendingUp className="w-5 h-5" />}
              color="text-success-600"
              bg="bg-success-50"
            />
            <StatCard
              label="Mapel Lulus (>=75)"
              value={`${nilaiSummary.lulus}/${nilaiSummary.total}`}
              icon={<Award className="w-5 h-5" />}
              color="text-warning-600"
              bg="bg-warning-50"
              trend={nilaiSummary.total > 0 ? { value: `${lulusRate}%`, up: lulusRate >= 75 } : undefined}
            />
          </div>

          {/* Kelas info */}
          {kelas.length > 0 && (
            <div className="card p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-surface-500" />
                </div>
                <h3 className="font-semibold text-surface-900 text-sm">Kelas Saya</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {kelas.map(k => (
                  <span
                    key={k.id}
                    className="inline-flex items-center gap-2 text-sm font-medium bg-brand-50 text-brand-700 rounded-lg px-3.5 py-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    {k.kelas?.nama_kelas} ({k.kelas?.tahun_ajaran})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate('/siswa/nilai')}
            className="btn-primary px-6 py-3 rounded-xl animate-slide-up"
          >
            <GraduationCap className="w-5 h-5" />
            Lihat Nilai Saya
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </Layout>
  );
}
