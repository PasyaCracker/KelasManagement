import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import type { Guru, Mapel, Kelas, GuruMapelKelas } from '../../types';

export default function AssignGuru() {
  const { notify } = useNotification();
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [assignments, setAssignments] = useState<(GuruMapelKelas & { guru: Guru; mapel: Mapel; kelas: Kelas })[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ guru_id: '', mapel_id: '', kelas_id: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [g, m, k, a] = await Promise.all([
      supabase.from('guru').select('*').order('nama'),
      supabase.from('mapel').select('*').order('nama_mapel'),
      supabase.from('kelas').select('*').order('nama_kelas'),
      supabase.from('guru_mapel_kelas').select('*, guru(*), mapel(*), kelas(*)').order('created_at', { ascending: false }),
    ]);
    setGuruList(g.data ?? []);
    setMapelList(m.data ?? []);
    setKelasList(k.data ?? []);
    setAssignments((a.data ?? []) as (GuruMapelKelas & { guru: Guru; mapel: Mapel; kelas: Kelas })[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = assignments.filter(a =>
    (a.guru?.nama ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (a.mapel?.nama_mapel ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (a.kelas?.nama_kelas ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => form.guru_id && form.mapel_id && form.kelas_id;

  const handleAdd = async () => {
    if (!validate()) { notify('warning', 'Harap lengkapi semua pilihan'); return; }
    setSaving(true);
    const { error } = await supabase.from('guru_mapel_kelas').insert({
      guru_id: form.guru_id,
      mapel_id: form.mapel_id,
      kelas_id: form.kelas_id,
    });
    if (error) notify('error', error.message.includes('unique') ? 'Guru sudah ditetapkan untuk mapel dan kelas ini' : 'Gagal menetapkan guru pengajar');
    else { notify('success', 'Guru pengajar berhasil ditetapkan'); setForm({ guru_id: '', mapel_id: '', kelas_id: '' }); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('guru_mapel_kelas').delete().eq('id', deleteId);
    if (error) notify('error', 'Gagal menghapus penetapan guru');
    else { notify('success', 'Penetapan guru berhasil dihapus'); load(); }
    setDeleting(false); setDeleteId(null);
  };

  const sel = (key: keyof typeof form, opts: { id: string; label: string }[], placeholder: string) => (
    <select
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );

  return (
    <Layout title="Tetapkan Guru Pengajar" subtitle="Kelola penugasan guru untuk setiap mata pelajaran dan kelas">
      <div className="space-y-5">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tambah Penetapan Guru</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {sel('guru_id', guruList.map(g => ({ id: g.id, label: g.nama })), 'Pilih Guru...')}
            {sel('mapel_id', mapelList.map(m => ({ id: m.id, label: m.nama_mapel })), 'Pilih Mapel...')}
            {sel('kelas_id', kelasList.map(k => ({ id: k.id, label: k.nama_kelas })), 'Pilih Kelas...')}
            <button
              onClick={handleAdd}
              disabled={saving || !validate()}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Tetapkan
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Daftar Penetapan Guru</h3>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari..."
                className="pl-3 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <EmptyState message="Belum ada penetapan guru" description="Gunakan form di atas untuk menetapkan guru pengajar" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['No', 'Guru', 'Mata Pelajaran', 'Kelas', 'Tahun Ajaran', 'Aksi'].map(h => (
                      <th key={h} className={`px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide ${h === 'Aksi' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((a, i) => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.guru?.nama}</td>
                      <td className="px-4 py-3 text-gray-700">{a.mapel?.nama_mapel}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">{a.kelas?.nama_kelas}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.kelas?.tahun_ajaran}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setDeleteId(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Penetapan Guru"
        message="Apakah Anda yakin ingin menghapus penetapan guru pengajar ini?"
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
