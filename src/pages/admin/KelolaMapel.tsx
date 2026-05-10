import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import type { Mapel } from '../../types';

interface FormData { kode_mapel: string; nama_mapel: string; deskripsi: string; }
const empty: FormData = { kode_mapel: '', nama_mapel: '', deskripsi: '' };

export default function KelolaMapel() {
  const { notify } = useNotification();
  const [list, setList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Mapel | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('mapel').select('*').order('nama_mapel');
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter(m =>
    m.nama_mapel.toLowerCase().includes(search.toLowerCase()) ||
    m.kode_mapel.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditItem(null); setForm(empty); setErrors({}); setModalOpen(true); };
  const openEdit = (m: Mapel) => {
    setEditItem(m);
    setForm({ kode_mapel: m.kode_mapel, nama_mapel: m.nama_mapel, deskripsi: m.deskripsi ?? '' });
    setErrors({}); setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.kode_mapel.trim()) e.kode_mapel = 'Kode mapel wajib diisi';
    if (!form.nama_mapel.trim()) e.nama_mapel = 'Nama mapel wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { kode_mapel: form.kode_mapel.toUpperCase(), nama_mapel: form.nama_mapel, deskripsi: form.deskripsi || null };

    const { error } = editItem
      ? await supabase.from('mapel').update(payload).eq('id', editItem.id)
      : await supabase.from('mapel').insert(payload);

    if (error) notify('error', error.message.includes('unique') ? 'Kode mapel sudah digunakan' : (editItem ? 'Gagal memperbarui mapel' : 'Gagal menambahkan mapel'));
    else { notify('success', editItem ? 'Mapel berhasil diperbarui' : 'Mapel berhasil ditambahkan'); load(); setModalOpen(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('mapel').delete().eq('id', deleteId);
    if (error) notify('error', 'Gagal menghapus mapel');
    else { notify('success', 'Mapel berhasil dihapus'); load(); }
    setDeleting(false); setDeleteId(null);
  };

  const inp = (name: keyof FormData, label: string, placeholder: string, textarea = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <input
          type="text"
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <Layout title="Kelola Mata Pelajaran" subtitle="Manajemen data mata pelajaran sekolah">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari mata pelajaran..." />
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Tambah Mapel
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada mata pelajaran" description="Klik tombol Tambah Mapel untuk membuat mata pelajaran baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['No', 'Kode', 'Nama Mata Pelajaran', 'Deskripsi', 'Aksi'].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide ${h === 'Aksi' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m, i) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded">{m.kode_mapel}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.nama_mapel}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.deskripsi ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title={editItem ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          {inp('kode_mapel', 'Kode Mapel', 'Contoh: MTK, ING, FIS')}
          {inp('nama_mapel', 'Nama Mata Pelajaran', 'Contoh: Matematika')}
          {inp('deskripsi', 'Deskripsi (Opsional)', 'Deskripsi singkat mata pelajaran', true)}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Hapus Mata Pelajaran" message="Apakah Anda yakin ingin menghapus mata pelajaran ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Layout>
  );
}
