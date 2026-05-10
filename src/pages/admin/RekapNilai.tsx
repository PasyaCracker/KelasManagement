import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, BookOpen, Users } from 'lucide-react';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import type { Kelas, Mapel, Nilai, Siswa } from '../../types';

interface NilaiRow extends Nilai {
  siswa: Siswa;
  mapel: Mapel;
  kelas: Kelas;
}

function gradeColor(v: number) {
  if (v >= 90) return 'text-success-700 font-semibold';
  if (v >= 75) return 'text-brand-700 font-semibold';
  if (v >= 60) return 'text-warning-700';
  return 'text-danger-600';
}

function gradeBadge(v: number) {
  if (v >= 90) return 'A';
  if (v >= 80) return 'B+';
  if (v >= 75) return 'B';
  if (v >= 65) return 'C+';
  if (v >= 60) return 'C';
  return 'D';
}

function gradeBg(v: number) {
  if (v >= 75) return 'bg-success-50 text-success-700';
  return 'bg-danger-50 text-danger-600';
}

export default function AdminRekapNilai() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [rows, setRows] = useState<NilaiRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('kelas').select('*').order('nama_kelas'),
      supabase.from('mapel').select('*').order('nama_mapel'),
    ]).then(([k, m]) => {
      setKelasList(k.data ?? []);
      setMapelList(m.data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!selectedKelas) { setRows([]); return; }
    setLoading(true);
    let q = supabase.from('nilai').select('*, siswa(*), mapel(*), kelas(*)').eq('kelas_id', selectedKelas);
    if (selectedMapel) q = q.eq('mapel_id', selectedMapel);
    q.order('created_at').then(({ data }) => {
      setRows((data ?? []) as NilaiRow[]);
      setLoading(false);
    });
  }, [selectedKelas, selectedMapel]);

  const grouped = rows.reduce((acc, r) => {
    const key = r.mapel?.nama_mapel ?? r.mapel_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, NilaiRow[]>);

  const totalSiswa = rows.length > 0 ? new Set(rows.map(r => r.siswa_id)).size : 0;
  const avgNilai = rows.length > 0
    ? (rows.reduce((s, r) => s + (r.nilai_akhir ?? 0), 0) / rows.length).toFixed(1)
    : '0';
  const lulusCount = rows.filter(r => (r.nilai_akhir ?? 0) >= 75).length;
  const lulusPersen = rows.length > 0 ? ((lulusCount / rows.length) * 100).toFixed(0) : '0';



  return (
    <Layout title="Rekap Nilai per Kelas" subtitle="Ringkasan nilai seluruh siswa berdasarkan kelas dan mata pelajaran">
      {/* Filter Card */}
      <div className="card p-5 mb-6 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-surface-900">Filter Data Nilai</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Kelas</label>
            <select
              value={selectedKelas}
              onChange={e => { setSelectedKelas(e.target.value); setSelectedMapel(''); }}
              className="input"
            >
              <option value="">Pilih Kelas...</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas} ({k.tahun_ajaran})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Mata Pelajaran (Opsional)</label>
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              disabled={!selectedKelas}
              className="input disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed"
            >
              <option value="">Semua Mata Pelajaran</option>
              {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedKelas ? (
        <EmptyState message="Pilih kelas untuk melihat rekap nilai" description="Gunakan filter di atas untuk memilih kelas" />
      ) : loading ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-surface-400">
            <span className="w-4 h-4 border-2 border-surface-300 border-t-brand-600 rounded-full animate-spin" />
            Memuat data nilai...
          </div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada data nilai" description="Nilai siswa belum diinput oleh guru" />
      ) : (
        <div className="space-y-5 animate-slide-up">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 font-medium">Siswa</p>
                  <p className="text-lg font-bold text-surface-900">{totalSiswa}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 font-medium">Rata-rata</p>
                  <p className="text-lg font-bold text-surface-900">{avgNilai}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-warning-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 font-medium">Mata Pelajaran</p>
                  <p className="text-lg font-bold text-surface-900">{Object.keys(grouped).length}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-success-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500 font-medium">Ketuntasan</p>
                  <p className="text-lg font-bold text-surface-900">{lulusPersen}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Mapel Tables */}
          {Object.entries(grouped).map(([mapelName, nilaiRows]) => {
            const mapelAvg = (nilaiRows.reduce((s, r) => s + (r.nilai_akhir ?? 0), 0) / nilaiRows.length).toFixed(1);
            const mapelLulus = nilaiRows.filter(r => (r.nilai_akhir ?? 0) >= 75).length;
            const mapelLulusPersen = ((mapelLulus / nilaiRows.length) * 100).toFixed(0);

            return (
              <div key={mapelName} className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{mapelName}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{nilaiRows.length} siswa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-surface-400">Rata-rata</p>
                      <p className={`text-base font-bold ${Number(mapelAvg) >= 75 ? 'text-success-600' : 'text-danger-600'}`}>
                        {mapelAvg}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-surface-100" />
                    <div className="text-right">
                      <p className="text-xs text-surface-400">Ketuntasan</p>
                      <p className={`text-base font-bold ${Number(mapelLulusPersen) >= 75 ? 'text-success-600' : 'text-warning-600'}`}>
                        {mapelLulusPersen}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-100">
                        <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                        <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">NIS</th>
                        <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nama Siswa</th>
                        <th className="text-center px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Tugas (40%)</th>
                        <th className="text-center px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">UTS (30%)</th>
                        <th className="text-center px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">UAS (30%)</th>
                        <th className="text-center px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nilai Akhir</th>
                        <th className="text-center px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50">
                      {nilaiRows.map((r, i) => (
                        <tr key={r.id} className="hover:bg-surface-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded">
                              {r.siswa?.nis ?? '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-surface-900">{r.siswa?.nama}</p>
                          </td>
                          <td className={`px-5 py-3.5 text-center ${gradeColor(r.nilai_tugas)}`}>
                            {r.nilai_tugas ?? '-'}
                          </td>
                          <td className={`px-5 py-3.5 text-center ${gradeColor(r.nilai_uts)}`}>
                            {r.nilai_uts ?? '-'}
                          </td>
                          <td className={`px-5 py-3.5 text-center ${gradeColor(r.nilai_uas)}`}>
                            {r.nilai_uas ?? '-'}
                          </td>
                          <td className={`px-5 py-3.5 text-center text-base font-bold ${gradeColor(r.nilai_akhir)}`}>
                            {r.nilai_akhir ?? '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {r.nilai_akhir != null ? (
                              <span className={`badge ${gradeBg(r.nilai_akhir)}`}>
                                {gradeBadge(r.nilai_akhir)}
                              </span>
                            ) : (
                              <span className="text-surface-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
