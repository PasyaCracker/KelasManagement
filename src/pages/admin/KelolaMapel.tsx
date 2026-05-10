import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
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

  const Field = ({ label, name, placeholder, textarea = false }: { label: string; name: keyof FormData; placeholder: string; textarea?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className={errors[name] ? 'input-error resize-none' : 'input resize-none'}
        />
      ) : (
        <input
          type="text"
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className={errors[name] ? 'input-error' : 'input'}
        />
      )}
      {errors[name] && <p className="text-xs text-danger-600 mt-1.5">{errors[name]}</p>}
    </div>
  );

  return (
    <Layout
      title="Kelola Mata Pelajaran"
      subtitle="Manajemen data mata pelajaran sekolah"
      action={
        <button onClick={openAdd} className="btn-primary px-4 py-2.5">
          <Plus className="w-4 h-4" />
          Tambah Mapel
        </button>
      }
    >
      <div className="card animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-danger-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">Daftar Mata Pelajaran</p>
              <p className="text-xs text-surface-400">{filtered.length} data</p>
            </div>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Cari kode atau nama mapel..." />
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-surface-400">
              <span className="w-4 h-4 border-2 border-surface-300 border-t-danger-500 rounded-full animate-spin" />
              Memuat data...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada mata pelajaran" description="Klik tombol Tambah Mapel untuk membuat mata pelajaran baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Kode</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nama Mata Pelajaran</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Deskripsi</th>
                  <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map((m, i) => (
                  <tr key={m.id} className="group hover:bg-surface-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-surface-700 bg-surface-100 px-2 py-1 rounded">
                        {m.kode_mapel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-surface-900">{m.nama_mapel}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-surface-500 max-w-xs truncate">{m.deskripsi ?? '-'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(m)} className="btn-ghost p-2 rounded-lg" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-brand-600" />
                        </button>
                        <button onClick={() => setDeleteId(m.id)} className="btn-ghost p-2 rounded-lg" title="Hapus">
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

      {/* Modal */}
      <Modal open={modalOpen} title={editItem ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Informasi Mata Pelajaran</p>
            <Field label="Kode Mapel" name="kode_mapel" placeholder="Contoh: MTK, ING, FIS" />
            <Field label="Nama Mata Pelajaran" name="nama_mapel" placeholder="Contoh: Matematika" />
            <Field label="Deskripsi (Opsional)" name="deskripsi" placeholder="Deskripsi singkat mata pelajaran" textarea />
          </div>
          <div className="flex gap-3 pt-3 border-t border-surface-100">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 py-2.5">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 py-2.5"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Hapus Mata Pelajaran" message="Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini tidak dapat dibatalkan." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Layout>
  );
}
