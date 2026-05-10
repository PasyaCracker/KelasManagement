import { useEffect, useState } from 'react';
import { Trash2, UserPlus, School, Users, ChevronRight } from 'lucide-react';
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
  const selectedKelasData = kelasList.find(k => k.id === selectedKelas);

  return (
    <Layout title="Tambah Siswa ke Kelas" subtitle="Kelola daftar siswa dalam setiap kelas">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 animate-fade-in">
        {/* Sidebar: Kelas List */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-surface-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-warning-50 flex items-center justify-center">
                <School className="w-3.5 h-3.5 text-warning-600" />
              </div>
              <p className="text-sm font-semibold text-surface-900">Pilih Kelas</p>
            </div>
          </div>
          <div className="p-2">
            {kelasList.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-surface-400">Belum ada kelas tersedia</p>
              </div>
            ) : (
              <div className="space-y-1">
                {kelasList.map(k => (
                  <button
                    key={k.id}
                    onClick={() => handleKelasChange(k.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                      selectedKelas === k.id
                        ? 'bg-brand-700 text-white shadow-card-hover'
                        : 'text-surface-700 hover:bg-surface-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{k.nama_kelas}</p>
                        <p className={`text-xs mt-0.5 ${selectedKelas === k.id ? 'text-brand-200' : 'text-surface-400'}`}>
                          {k.tahun_ajaran}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedKelas === k.id ? 'text-brand-200' : 'text-surface-300 group-hover:translate-x-0.5'}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-5">
          {!selectedKelas ? (
            <div className="card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-surface-400" />
              </div>
              <p className="text-sm font-medium text-surface-600">Pilih kelas dari daftar di sebelah kiri</p>
              <p className="text-xs text-surface-400 mt-1">untuk melihat dan mengelola daftar siswa</p>
            </div>
          ) : (
            <>
              {/* Add Form */}
              <div className="card p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-success-50 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">Tambah Siswa ke {selectedKelasName}</p>
                    <p className="text-xs text-surface-400">
                      {available.length} siswa tersedia
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedSiswa}
                    onChange={e => setSelectedSiswa(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Pilih siswa...</option>
                    {available.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} {s.nis ? `(${s.nis})` : ''}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedSiswa || saving}
                    className="btn-primary px-4 py-2.5 whitespace-nowrap"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Tambahkan
                  </button>
                </div>
                {available.length === 0 && !loading && (
                  <p className="text-xs text-surface-400 mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                    Semua siswa sudah terdaftar di kelas ini
                  </p>
                )}
              </div>

              {/* Enrollment Table */}
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">Daftar Siswa di {selectedKelasName}</p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {enrollments.length} siswa terdaftar
                        {selectedKelasData?.jurusan && ` · ${selectedKelasData.jurusan}`}
                      </p>
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-surface-400">
                      <span className="w-4 h-4 border-2 border-surface-300 border-t-brand-600 rounded-full animate-spin" />
                      Memuat data...
                    </div>
                  </div>
                ) : enrollments.length === 0 ? (
                  <EmptyState message="Belum ada siswa di kelas ini" description="Tambahkan siswa menggunakan form di atas" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-100">
                          <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                          <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">NIS</th>
                          <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nama</th>
                          <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Jenis Kelamin</th>
                          <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-50">
                        {enrollments.map((e, i) => (
                          <tr key={e.id} className="group hover:bg-surface-50/80 transition-colors">
                            <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded">
                                {e.siswa?.nis ?? '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-surface-900">{e.siswa?.nama}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              {e.siswa?.jenis_kelamin ? (
                                <span className={`badge ${e.siswa.jenis_kelamin === 'L' ? 'bg-brand-50 text-brand-700' : 'bg-pink-50 text-pink-700'}`}>
                                  {e.siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                              ) : (
                                <span className="text-surface-400">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setDeleteId(e.id)} className="btn-ghost p-2 rounded-lg" title="Keluarkan">
                                  <Trash2 className="w-3.5 h-3.5 text-danger-500" />
                                </button>
                              </div>
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
