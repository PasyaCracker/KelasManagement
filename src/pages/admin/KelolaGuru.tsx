import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react';
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
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className={errors[name] ? 'input-error' : 'input'}
      />
      {errors[name] && <p className="text-xs text-danger-600 mt-1.5">{errors[name]}</p>}
    </div>
  );

  return (
    <Layout
      title="Kelola Data Guru"
      subtitle="Manajemen data guru dan akun pengajar"
      action={
        <button onClick={openAdd} className="btn-primary px-4 py-2.5">
          <Plus className="w-4 h-4" />
          Tambah Guru
        </button>
      }
    >
      <div className="card animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">Daftar Guru</p>
              <p className="text-xs text-surface-400">{filtered.length} data</p>
            </div>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, NIP, atau email..." />
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-surface-400">
              <span className="w-4 h-4 border-2 border-surface-300 border-t-brand-600 rounded-full animate-spin" />
              Memuat data...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data guru" description="Klik tombol Tambah Guru untuk menambahkan data guru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">NIP</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nama</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Telepon</th>
                  <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map((g, i) => (
                  <tr key={g.id} className="group hover:bg-surface-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded">{g.nip ?? '-'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-surface-900">{g.nama}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {g.email ? (
                        <span className="flex items-center gap-1.5 text-surface-500">
                          <Mail className="w-3.5 h-3.5 text-surface-400" />
                          {g.email}
                        </span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {g.telepon ? (
                        <span className="flex items-center gap-1.5 text-surface-500">
                          <Phone className="w-3.5 h-3.5 text-surface-400" />
                          {g.telepon}
                        </span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(g)} className="btn-ghost p-2 rounded-lg" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-brand-600" />
                        </button>
                        <button onClick={() => setDeleteId(g.id)} className="btn-ghost p-2 rounded-lg" title="Hapus">
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
      <Modal open={modalOpen} title={editItem ? 'Edit Data Guru' : 'Tambah Guru Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Informasi Pribadi</p>
            <Field label="NIP" name="nip" placeholder="Nomor Induk Pegawai" />
            <Field label="Nama Lengkap" name="nama" placeholder="Nama lengkap guru" />
            <Field label="Email" name="email" type="email" placeholder="Email (opsional)" />
            <Field label="Telepon" name="telepon" placeholder="Nomor telepon (opsional)" />
          </div>
          {!editItem && (
            <div className="border-t border-surface-100 pt-5">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">Akun Login</p>
              <div className="space-y-4">
                <Field label="Username" name="username" placeholder="Username untuk login" />
                <Field label="Password" name="password" type="password" placeholder="Password untuk login" />
              </div>
            </div>
          )}
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
