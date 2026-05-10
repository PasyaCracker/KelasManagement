import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Nilai, Siswa, Mapel, Kelas } from '../../types';

interface NilaiRow extends Nilai {
  mapel: Mapel;
  kelas: Kelas;
}

function gradeColor(v: number) {
  if (v >= 90) return 'text-emerald-700 font-bold';
  if (v >= 75) return 'text-blue-700 font-semibold';
  if (v >= 60) return 'text-amber-700';
  return 'text-red-600';
}

function gradeBadge(v: number) {
  if (v >= 90) return { label: 'A', cls: 'bg-emerald-100 text-emerald-700' };
  if (v >= 80) return { label: 'B+', cls: 'bg-blue-100 text-blue-700' };
  if (v >= 75) return { label: 'B', cls: 'bg-blue-100 text-blue-600' };
  if (v >= 65) return { label: 'C+', cls: 'bg-amber-100 text-amber-700' };
  if (v >= 60) return { label: 'C', cls: 'bg-amber-100 text-amber-600' };
  return { label: 'D', cls: 'bg-red-100 text-red-600' };
}

export default function LihatNilai() {
  const { user } = useAuth();
  const [siswaProfile, setSiswaProfile] = useState<Siswa | null>(null);
  const [rows, setRows] = useState<NilaiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [kelasList, setKelasList] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: profile } = await supabase.from('siswa').select('*').eq('user_id', user.id).maybeSingle();
      if (!profile) { setLoading(false); return; }
      setSiswaProfile(profile as Siswa);

      const { data } = await supabase
        .from('nilai')
        .select('*, mapel(*), kelas(*)')
        .eq('siswa_id', profile.id)
        .order('created_at');

      const nilaiRows = (data ?? []) as NilaiRow[];
      setRows(nilaiRows);

      const kelasMap = new Map<string, string>();
      nilaiRows.forEach(r => {
        if (r.kelas) kelasMap.set(r.kelas_id, r.kelas.nama_kelas);
      });
      setKelasList(Array.from(kelasMap.entries()).map(([id, nama]) => ({ id, nama })));
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = selectedKelas ? rows.filter(r => r.kelas_id === selectedKelas) : rows;
  const avg = filtered.length ? filtered.reduce((s, r) => s + (r.nilai_akhir ?? 0), 0) / filtered.length : 0;
  const lulus = filtered.filter(r => (r.nilai_akhir ?? 0) >= 75).length;

  return (
    <Layout title="Nilai Saya" subtitle="Daftar nilai mata pelajaran Anda">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada data nilai" description="Nilai Anda belum diinput oleh guru" />
      ) : (
        <div className="space-y-5">
          {/* Filters & summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedKelas}
                onChange={e => setSelectedKelas(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-blue-700 text-lg">{avg.toFixed(1)}</p>
                <p className="text-gray-400 text-xs">Rata-rata</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-emerald-600 text-lg">{lulus}/{filtered.length}</p>
                <p className="text-gray-400 text-xs">Lulus</p>
              </div>
            </div>
          </div>

          {/* Cards view for mobile, table for desktop */}
          <div className="sm:hidden space-y-3">
            {filtered.map(r => {
              const badge = r.nilai_akhir != null ? gradeBadge(r.nilai_akhir) : null;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{r.mapel?.nama_mapel}</p>
                      <p className="text-xs text-gray-400">{r.kelas?.nama_kelas}</p>
                    </div>
                    {badge && (
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${badge.cls}`}>{badge.label}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Tugas', val: r.nilai_tugas },
                      { label: 'UTS', val: r.nilai_uts },
                      { label: 'UAS', val: r.nilai_uas },
                      { label: 'Akhir', val: r.nilai_akhir },
                    ].map(n => (
                      <div key={n.label} className="bg-gray-50 rounded-lg p-2">
                        <p className={`font-bold text-base ${n.val != null ? gradeColor(n.val) : 'text-gray-300'}`}>
                          {n.val?.toFixed(1) ?? '-'}
                        </p>
                        <p className="text-xs text-gray-400">{n.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['No', 'Mata Pelajaran', 'Kelas', 'Tugas (40%)', 'UTS (30%)', 'UAS (30%)', 'Nilai Akhir', 'Grade', 'Status'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide ${['Tugas (40%)', 'UTS (30%)', 'UAS (30%)', 'Nilai Akhir', 'Grade', 'Status'].includes(h) ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, i) => {
                  const badge = r.nilai_akhir != null ? gradeBadge(r.nilai_akhir) : null;
                  const lulus = (r.nilai_akhir ?? 0) >= 75;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.mapel?.nama_mapel}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r.kelas?.nama_kelas}</span>
                      </td>
                      <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_tugas)}`}>{r.nilai_tugas?.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_uts)}`}>{r.nilai_uts?.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_uas)}`}>{r.nilai_uas?.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-center text-base ${r.nilai_akhir != null ? gradeColor(r.nilai_akhir) : 'text-gray-300'}`}>
                        {r.nilai_akhir?.toFixed(1) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {badge && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lulus ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
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
      )}
    </Layout>
  );
}
