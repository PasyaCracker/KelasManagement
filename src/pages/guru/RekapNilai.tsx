import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Guru, Mapel, Kelas, Nilai, Siswa, GuruMapelKelas } from '../../types';

interface Assignment extends GuruMapelKelas { mapel: Mapel; kelas: Kelas; }
interface NilaiRow extends Nilai { siswa: Siswa; mapel: Mapel; kelas: Kelas; }

function gradeColor(v: number) {
  if (v >= 90) return 'text-emerald-700 font-semibold';
  if (v >= 75) return 'text-blue-700 font-semibold';
  if (v >= 60) return 'text-amber-700';
  return 'text-red-600';
}

export default function GuruRekapNilai() {
  const { user } = useAuth();
  const [guruProfile, setGuruProfile] = useState<Guru | null>(null);
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

  return (
    <Layout title="Rekap Nilai Mapel Saya" subtitle="Ringkasan nilai siswa untuk mata pelajaran yang Anda ajarkan">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Kelas & Mata Pelajaran</label>
        <select
          value={selectedAssignment}
          onChange={e => setSelectedAssignment(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Pilih kelas dan mata pelajaran --</option>
          {assignments.map(a => (
            <option key={a.id} value={a.id}>{a.kelas?.nama_kelas} - {a.mapel?.nama_mapel}</option>
          ))}
        </select>
      </div>

      {!selectedAssignment ? (
        <EmptyState message="Pilih kelas dan mata pelajaran" description="Gunakan dropdown di atas untuk melihat rekap nilai" />
      ) : loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">Memuat data...</div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada data nilai" description="Nilai siswa belum diinput untuk kelas ini" />
      ) : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Siswa', value: rows.length, color: 'text-gray-900', bg: 'bg-gray-50' },
              { label: 'Rata-rata Nilai', value: avg.toFixed(1), color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Lulus (≥75)', value: `${passing}/${rows.length}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{selectedAsgn?.kelas?.nama_kelas} — {selectedAsgn?.mapel?.nama_mapel}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['No', 'NIS', 'Nama Siswa', 'Tugas (40%)', 'UTS (30%)', 'UAS (30%)', 'Nilai Akhir', 'Status'].map(h => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide ${['Tugas (40%)', 'UTS (30%)', 'UAS (30%)', 'Nilai Akhir', 'Status'].includes(h) ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.siswa?.nis ?? '-'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.siswa?.nama}</td>
                      <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_tugas)}`}>{r.nilai_tugas}</td>
                      <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_uts)}`}>{r.nilai_uts}</td>
                      <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_uas)}`}>{r.nilai_uas}</td>
                      <td className={`px-4 py-3 text-center text-base ${gradeColor(r.nilai_akhir)}`}>{r.nilai_akhir?.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${(r.nilai_akhir ?? 0) >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {(r.nilai_akhir ?? 0) >= 75 ? 'Lulus' : 'Tidak Lulus'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
