import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import type { Guru } from '../../types';

interface FormData {
  nip: string;
  nama: string;
  email: string;
  telepon: string;
  username: string;
  password: string;
}

const empty: FormData = { nip: '', nama: '', email: '', telepon: '', username: '', password: '' };

export default function KelolaGuru() {
  const { notify } = useNotification();
  const [list, setList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Guru | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('guru').select('*').order('nama');
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter(g =>
    g.nama.toLowerCase().includes(search.toLowerCase()) ||
    (g.nip ?? '').includes(search) ||
    (g.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditItem(null);
    setForm(empty);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (g: Guru) => {
    setEditItem(g);
    setForm({ nip: g.nip ?? '', nama: g.nama, email: g.email ?? '', telepon: g.telepon ?? '', username: '', password: '' });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi';
    if (!form.nip.trim()) e.nip = 'NIP wajib diisi';
    if (!editItem && !form.username.trim()) e.username = 'Username wajib diisi';
    if (!editItem && !form.password.trim()) e.password = 'Password wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    if (editItem) {
      const { error } = await supabase.from('guru').update({
        nip: form.nip,
        nama: form.nama,
        email: form.email || null,
        telepon: form.telepon || null,
      }).eq('id', editItem.id);

      if (error) { notify('error', 'Gagal memperbarui data guru'); setSaving(false); return; }
      notify('success', 'Data guru berhasil diperbarui');
    } else {
      // Check username availability
      const { data: existing } = await supabase.from('users').select('id').eq('username', form.username).maybeSingle();
      if (existing) {
        setErrors(e => ({ ...e, username: 'Username sudah digunakan' }));
        setSaving(false);
        return;
      }

      const { data: newUser, error: userErr } = await supabase.from('users').insert({
        username: form.username,
        password_hash: form.password,
        nama: form.nama,
        role: 'guru',
      }).select().single();

      if (userErr) { notify('error', 'Gagal membuat akun guru'); setSaving(false); return; }

      const { error } = await supabase.from('guru').insert({
        user_id: newUser.id,
        nip: form.nip,
        nama: form.nama,
        email: form.email || null,
        telepon: form.telepon || null,
      });

      if (error) {
        await supabase.from('users').delete().eq('id', newUser.id);
        notify('error', 'Gagal menambahkan data guru');
        setSaving(false);
        return;
      }
      notify('success', 'Data guru berhasil ditambahkan');
    }

    setSaving(false);
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('guru').delete().eq('id', deleteId);
    if (error) { notify('error', 'Gagal menghapus data guru'); }
    else { notify('success', 'Data guru berhasil dihapus'); load(); }
    setDeleting(false);
    setDeleteId(null);
  };

  const Field = ({ label, name, type = 'text', placeholder }: { label: string; name: keyof FormData; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <Layout title="Kelola Data Guru" subtitle="Manajemen data guru dan akun pengajar">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari guru..." />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Guru
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data guru" description="Klik tombol Tambah Guru untuk menambahkan data guru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">NIP</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Telepon</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((g, i) => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{g.nip ?? '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{g.nama}</td>
                    <td className="px-4 py-3 text-gray-500">{g.email ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{g.telepon ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(g)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(g.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
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

      <Modal open={modalOpen} title={editItem ? 'Edit Data Guru' : 'Tambah Guru Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <Field label="NIP" name="nip" placeholder="Nomor Induk Pegawai" />
          <Field label="Nama Lengkap" name="nama" placeholder="Nama lengkap guru" />
          <Field label="Email" name="email" type="email" placeholder="Email (opsional)" />
          <Field label="Telepon" name="telepon" placeholder="Nomor telepon (opsional)" />
          {!editItem && (
            <>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Akun Login</p>
                <div className="space-y-3">
                  <Field label="Username" name="username" placeholder="Username untuk login" />
                  <Field label="Password" name="password" type="password" placeholder="Password untuk login" />
                </div>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Data Guru"
        message="Apakah Anda yakin ingin menghapus data guru ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
