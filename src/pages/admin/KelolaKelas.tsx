import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, School } from 'lucide-react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import type { Kelas } from '../../types';

interface FormData { nama_kelas: string; tingkat: string; jurusan: string; tahun_ajaran: string; }
const empty: FormData = { nama_kelas: '', tingkat: '', jurusan: '', tahun_ajaran: '' };

export default function KelolaKelas() {
  const { notify } = useNotification();
  const [list, setList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Kelas | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter(k =>
    k.nama_kelas.toLowerCase().includes(search.toLowerCase()) ||
    k.tingkat.toLowerCase().includes(search.toLowerCase()) ||
    (k.jurusan ?? '').toLowerCase().includes(search.toLowerCase()) ||
    k.tahun_ajaran.includes(search)
  );

  const openAdd = () => { setEditItem(null); setForm(empty); setErrors({}); setModalOpen(true); };
  const openEdit = (k: Kelas) => {
    setEditItem(k);
    setForm({ nama_kelas: k.nama_kelas, tingkat: k.tingkat, jurusan: k.jurusan ?? '', tahun_ajaran: k.tahun_ajaran });
    setErrors({}); setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.nama_kelas.trim()) e.nama_kelas = 'Nama kelas wajib diisi';
    if (!form.tingkat.trim()) e.tingkat = 'Tingkat wajib dipilih';
    if (!form.tahun_ajaran.trim()) e.tahun_ajaran = 'Tahun ajaran wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { nama_kelas: form.nama_kelas, tingkat: form.tingkat, jurusan: form.jurusan || null, tahun_ajaran: form.tahun_ajaran };

    const { error } = editItem
      ? await supabase.from('kelas').update(payload).eq('id', editItem.id)
      : await supabase.from('kelas').insert(payload);

    if (error) notify('error', editItem ? 'Gagal memperbarui kelas' : 'Gagal menambahkan kelas');
    else { notify('success', editItem ? 'Kelas berhasil diperbarui' : 'Kelas berhasil ditambahkan'); load(); setModalOpen(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('kelas').delete().eq('id', deleteId);
    if (error) notify('error', 'Gagal menghapus kelas');
    else { notify('success', 'Kelas berhasil dihapus'); load(); }
    setDeleting(false); setDeleteId(null);
  };

  const tingkatColors: Record<string, string> = {
    'X': 'bg-brand-50 text-brand-700',
    'XI': 'bg-success-50 text-success-700',
    'XII': 'bg-warning-50 text-warning-700',
  };

  const Field = ({ label, name, type = 'text', placeholder, isSelect = false, options = [] }: { label: string; name: keyof FormData; type?: string; placeholder?: string; isSelect?: boolean; options?: string[] }) => (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      {isSelect ? (
        <select
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className={errors[name] ? 'input-error' : 'input'}
        >
          <option value="">Pilih {label.toLowerCase()}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
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
      title="Kelola Data Kelas"
      subtitle="Manajemen data kelas dan rombongan belajar"
      action={
        <button onClick={openAdd} className="btn-primary px-4 py-2.5">
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>
      }
    >
      <div className="card animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
              <School className="w-4 h-4 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">Daftar Kelas</p>
              <p className="text-xs text-surface-400">{filtered.length} data</p>
            </div>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Cari kelas, tingkat, atau jurusan..." />
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-surface-400">
              <span className="w-4 h-4 border-2 border-surface-300 border-t-warning-500 rounded-full animate-spin" />
              Memuat data...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data kelas" description="Klik tombol Tambah Kelas untuk membuat kelas baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nama Kelas</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Tingkat</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Jurusan</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Tahun Ajaran</th>
                  <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map((k, i) => (
                  <tr key={k.id} className="group hover:bg-surface-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-surface-900">{k.nama_kelas}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${tingkatColors[k.tingkat] ?? 'bg-surface-100 text-surface-700'}`}>
                        {k.tingkat}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-surface-500">{k.jurusan ?? '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-surface-600">{k.tahun_ajaran}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(k)} className="btn-ghost p-2 rounded-lg" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-brand-600" />
                        </button>
                        <button onClick={() => setDeleteId(k.id)} className="btn-ghost p-2 rounded-lg" title="Hapus">
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
      <Modal open={modalOpen} title={editItem ? 'Edit Kelas' : 'Tambah Kelas Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Informasi Kelas</p>
            <Field label="Nama Kelas" name="nama_kelas" placeholder="Contoh: X IPA 1" />
            <Field label="Tingkat" name="tingkat" isSelect options={['X', 'XI', 'XII']} />
            <Field label="Jurusan (Opsional)" name="jurusan" placeholder="Contoh: IPA, IPS, RPL" />
            <Field label="Tahun Ajaran" name="tahun_ajaran" placeholder="Contoh: 2024/2025" />
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

      <ConfirmDialog open={!!deleteId} title="Hapus Kelas" message="Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Layout>
  );
}
