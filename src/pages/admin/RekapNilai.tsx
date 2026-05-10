import { useEffect, useState } from 'react';
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
  if (v >= 90) return 'text-emerald-700 font-semibold';
  if (v >= 75) return 'text-blue-700 font-semibold';
  if (v >= 60) return 'text-amber-700';
  return 'text-red-600';
}

function gradeBadge(v: number) {
  if (v >= 90) return 'A';
  if (v >= 80) return 'B+';
  if (v >= 75) return 'B';
  if (v >= 65) return 'C+';
  if (v >= 60) return 'C';
  return 'D';
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

  return (
    <Layout title="Rekap Nilai per Kelas" subtitle="Ringkasan nilai seluruh siswa berdasarkan kelas dan mata pelajaran">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kelas</label>
            <select
              value={selectedKelas}
              onChange={e => { setSelectedKelas(e.target.value); setSelectedMapel(''); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kelas...</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas} ({k.tahun_ajaran})</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mata Pelajaran (Opsional)</label>
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              disabled={!selectedKelas}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">Memuat data nilai...</div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada data nilai" description="Nilai siswa belum diinput oleh guru" />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([mapelName, nilaiRows]) => (
            <div key={mapelName} className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{mapelName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{nilaiRows.length} siswa</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Rata-rata Nilai Akhir</p>
                  <p className="text-lg font-bold text-blue-700">
                    {(nilaiRows.reduce((s, r) => s + (r.nilai_akhir ?? 0), 0) / nilaiRows.length).toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">NIS</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nama Siswa</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Tugas (40%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">UTS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">UAS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nilai Akhir</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {nilaiRows.map((r, i) => (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.siswa?.nis ?? '-'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.siswa?.nama}</td>
                        <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_tugas)}`}>{r.nilai_tugas ?? '-'}</td>
                        <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_uts)}`}>{r.nilai_uts ?? '-'}</td>
                        <td className={`px-4 py-3 text-center ${gradeColor(r.nilai_uas)}`}>{r.nilai_uas ?? '-'}</td>
                        <td className={`px-4 py-3 text-center text-base ${gradeColor(r.nilai_akhir)}`}>{r.nilai_akhir ?? '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                            (r.nilai_akhir ?? 0) >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.nilai_akhir != null ? gradeBadge(r.nilai_akhir) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
