import { useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import type { Kelas, Siswa, KelasSiswa } from '../../types';

export default function AssignSiswa() {
  const { notify } = useNotification();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [enrollments, setEnrollments] = useState<(KelasSiswa & { siswa: Siswa })[]>([]);
  const [available, setAvailable] = useState<Siswa[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('kelas').select('*').order('nama_kelas'),
      supabase.from('siswa').select('*').order('nama'),
    ]).then(([k, s]) => {
      setKelasList(k.data ?? []);
      setSiswaList(s.data ?? []);
    });
  }, []);

  const loadEnrollments = async (kelasId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('kelas_siswa')
      .select('*, siswa(*)')
      .eq('kelas_id', kelasId)
      .order('created_at');

    const enrolled = (data ?? []) as (KelasSiswa & { siswa: Siswa })[];
    setEnrollments(enrolled);

    const enrolledIds = new Set(enrolled.map(e => e.siswa_id));
    setAvailable(siswaList.filter(s => !enrolledIds.has(s.id)));
    setLoading(false);
  };

  const handleKelasChange = (id: string) => {
    setSelectedKelas(id);
    setSelectedSiswa('');
    if (id) loadEnrollments(id);
    else { setEnrollments([]); setAvailable([]); }
  };

  const handleAdd = async () => {
    if (!selectedKelas || !selectedSiswa) return;
    setSaving(true);
    const { error } = await supabase.from('kelas_siswa').insert({ kelas_id: selectedKelas, siswa_id: selectedSiswa });
    if (error) notify('error', 'Gagal menambahkan siswa ke kelas');
    else { notify('success', 'Siswa berhasil ditambahkan ke kelas'); setSelectedSiswa(''); loadEnrollments(selectedKelas); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('kelas_siswa').delete().eq('id', deleteId);
    if (error) notify('error', 'Gagal mengeluarkan siswa dari kelas');
    else { notify('success', 'Siswa berhasil dikeluarkan dari kelas'); loadEnrollments(selectedKelas); }
    setDeleting(false); setDeleteId(null);
  };

  const selectedKelasName = kelasList.find(k => k.id === selectedKelas)?.nama_kelas;

  return (
    <Layout title="Tambah Siswa ke Kelas" subtitle="Kelola daftar siswa dalam setiap kelas">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pilih Kelas</h3>
          <div className="space-y-2">
            {kelasList.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada kelas tersedia</p>
            ) : kelasList.map(k => (
              <button
                key={k.id}
                onClick={() => handleKelasChange(k.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedKelas === k.id ? 'bg-blue-700 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className="font-medium">{k.nama_kelas}</p>
                <p className={`text-xs ${selectedKelas === k.id ? 'text-blue-200' : 'text-gray-400'}`}>{k.tahun_ajaran}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedKelas ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm">Pilih kelas dari daftar di sebelah kiri</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Tambah Siswa ke {selectedKelasName}</h3>
                <div className="flex gap-3">
                  <select
                    value={selectedSiswa}
                    onChange={e => setSelectedSiswa(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih siswa...</option>
                    {available.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} {s.nis ? `(${s.nis})` : ''}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedSiswa || saving}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Tambahkan
                  </button>
                </div>
                {available.length === 0 && !loading && (
                  <p className="text-xs text-gray-400 mt-2">Semua siswa sudah terdaftar di kelas ini</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Daftar Siswa di {selectedKelasName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{enrollments.length} siswa terdaftar</p>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
                ) : enrollments.length === 0 ? (
                  <EmptyState message="Belum ada siswa di kelas ini" description="Tambahkan siswa menggunakan form di atas" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">No</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">NIS</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nama</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Jenis Kelamin</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {enrollments.map((e, i) => (
                          <tr key={e.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.siswa?.nis ?? '-'}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{e.siswa?.nama}</td>
                            <td className="px-4 py-3">
                              {e.siswa?.jenis_kelamin ? (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.siswa.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                  {e.siswa.jenis_kelamin === 'L' ? 'L' : 'P'}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => setDeleteId(e.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Keluarkan Siswa"
        message="Apakah Anda yakin ingin mengeluarkan siswa ini dari kelas?"
        confirmLabel="Keluarkan"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
