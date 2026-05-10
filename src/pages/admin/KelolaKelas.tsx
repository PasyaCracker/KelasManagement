import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

  const sel = (name: keyof FormData, label: string, opts: string[]) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      >
        <option value="">Pilih {label.toLowerCase()}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  const inp = (name: keyof FormData, label: string, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <Layout title="Kelola Data Kelas" subtitle="Manajemen data kelas dan rombongan belajar">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari kelas..." />
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Tambah Kelas
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data kelas" description="Klik tombol Tambah Kelas untuk membuat kelas baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['No', 'Nama Kelas', 'Tingkat', 'Jurusan', 'Tahun Ajaran', 'Aksi'].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide ${h === 'Aksi' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((k, i) => (
                  <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{k.nama_kelas}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{k.tingkat}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{k.jurusan ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{k.tahun_ajaran}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(k)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(k.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title={editItem ? 'Edit Kelas' : 'Tambah Kelas Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          {inp('nama_kelas', 'Nama Kelas', 'Contoh: X IPA 1')}
          {sel('tingkat', 'Tingkat', ['X', 'XI', 'XII'])}
          {inp('jurusan', 'Jurusan (Opsional)', 'Contoh: IPA, IPS, RPL')}
          {inp('tahun_ajaran', 'Tahun Ajaran', 'Contoh: 2024/2025')}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Hapus Kelas" message="Apakah Anda yakin ingin menghapus kelas ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Layout>
  );
}
