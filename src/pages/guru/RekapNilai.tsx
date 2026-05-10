import { useEffect, useState } from 'react';
import { Users, TrendingUp, CheckCircle2, ChevronDown, BookOpen } from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Guru, Mapel, Kelas, Nilai, Siswa, GuruMapelKelas } from '../../types';

interface Assignment extends GuruMapelKelas { mapel: Mapel; kelas: Kelas; }
interface NilaiRow extends Nilai { siswa: Siswa; mapel: Mapel; kelas: Kelas; }

function gradeColor(v: number) {
  if (v >= 90) return 'text-success-700 font-semibold';
  if (v >= 75) return 'text-brand-700 font-semibold';
  if (v >= 60) return 'text-warning-700';
  return 'text-danger-600';
}

export default function GuruRekapNilai() {
  const { user } = useAuth();
  const [, setGuruProfile] = useState<Guru | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [rows, setRows] = useState<NilaiRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('guru').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setGuruProfile(data as Guru);
      supabase
        .from('guru_mapel_kelas')
        .select('*, mapel(*), kelas(*)')
        .eq('guru_id', data.id)
        .then(({ data: asgn }) => setAssignments((asgn ?? []) as Assignment[]));
    });
  }, [user]);

  useEffect(() => {
    if (!selectedAssignment) { setRows([]); return; }
    const asgn = assignments.find(a => a.id === selectedAssignment);
    if (!asgn) return;
    setLoading(true);
    supabase
      .from('nilai')
      .select('*, siswa(*), mapel(*), kelas(*)')
      .eq('mapel_id', asgn.mapel_id)
      .eq('kelas_id', asgn.kelas_id)
      .order('created_at')
      .then(({ data }) => {
        setRows((data ?? []) as NilaiRow[]);
        setLoading(false);
      });
  }, [selectedAssignment, assignments]);

  const selectedAsgn = assignments.find(a => a.id === selectedAssignment);
  const avg = rows.length ? rows.reduce((s, r) => s + (r.nilai_akhir ?? 0), 0) / rows.length : 0;
  const passing = rows.filter(r => (r.nilai_akhir ?? 0) >= 75).length;
  const passingRate = rows.length ? Math.round((passing / rows.length) * 100) : 0;

  return (
    <Layout title="Rekap Nilai Mapel Saya" subtitle="Ringkasan nilai siswa untuk mata pelajaran yang Anda ajarkan">
      <div className="space-y-6 animate-fade-in">
        {/* Selector */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <label className="text-sm font-semibold text-surface-900">Pilih Kelas & Mata Pelajaran</label>
          </div>
          <div className="relative max-w-md">
            <select
              value={selectedAssignment}
              onChange={e => setSelectedAssignment(e.target.value)}
              className="input appearance-none pr-10 cursor-pointer"
            >
              <option value="">-- Pilih kelas dan mata pelajaran --</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.kelas?.nama_kelas} - {a.mapel?.nama_mapel}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
        </div>

        {!selectedAssignment ? (
          <EmptyState message="Pilih kelas dan mata pelajaran" description="Gunakan dropdown di atas untuk melihat rekap nilai" />
        ) : loading ? (
          <div className="card p-12 text-center">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-500">Memuat data...</p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="Belum ada data nilai" description="Nilai siswa belum diinput untuk kelas ini" />
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Siswa"
                value={rows.length}
                icon={<Users className="w-5 h-5" />}
                color="text-surface-600"
                bg="bg-surface-100"
              />
              <StatCard
                label="Rata-rata Nilai"
                value={avg.toFixed(1)}
                icon={<TrendingUp className="w-5 h-5" />}
                color="text-brand-600"
                bg="bg-brand-50"
              />
              <StatCard
                label="Ketuntasan (>=75)"
                value={`${passingRate}%`}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="text-success-600"
                bg="bg-success-50"
                trend={{ value: `${passing}/${rows.length} siswa`, up: passingRate >= 75 }}
              />
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">
                  {selectedAsgn?.kelas?.nama_kelas} — {selectedAsgn?.mapel?.nama_mapel}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-12">No</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">NIS</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Tugas (40%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">UTS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">UAS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Nilai Akhir</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {rows.map((r, i) => {
                      const lulus = (r.nilai_akhir ?? 0) >= 75;
                      return (
                        <tr key={r.id} className="hover:bg-surface-50/80 transition-colors duration-150">
                          <td className="px-6 py-3.5 text-surface-400 font-medium tabular-nums">{i + 1}</td>
                          <td className="px-6 py-3.5 font-mono text-xs text-surface-500">{r.siswa?.nis ?? '-'}</td>
                          <td className="px-6 py-3.5 font-medium text-surface-900">{r.siswa?.nama}</td>
                          <td className={`px-4 py-3.5 text-center tabular-nums ${gradeColor(r.nilai_tugas)}`}>{r.nilai_tugas}</td>
                          <td className={`px-4 py-3.5 text-center tabular-nums ${gradeColor(r.nilai_uts)}`}>{r.nilai_uts}</td>
                          <td className={`px-4 py-3.5 text-center tabular-nums ${gradeColor(r.nilai_uas)}`}>{r.nilai_uas}</td>
                          <td className={`px-4 py-3.5 text-center text-base tabular-nums ${gradeColor(r.nilai_akhir)}`}>{r.nilai_akhir?.toFixed(1)}</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`badge ${lulus ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-600'}`}>
                              {lulus ? 'Lulus' : 'Tidak Lulus'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
