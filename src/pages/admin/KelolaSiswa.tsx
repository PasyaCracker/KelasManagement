import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, Mail, Phone } from 'lucide-react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import type { Siswa } from '../../types';

interface FormData {
  nis: string;
  nama: string;
  email: string;
  telepon: string;
  jenis_kelamin: string;
  username: string;
  password: string;
}

const empty: FormData = { nis: '', nama: '', email: '', telepon: '', jenis_kelamin: '', username: '', password: '' };

export default function KelolaSiswa() {
  const { notify } = useNotification();
  const [list, setList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Siswa | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('siswa').select('*').order('nama');
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    (s.nis ?? '').includes(search) ||
    (s.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditItem(null); setForm(empty); setErrors({}); setModalOpen(true); };
  const openEdit = (s: Siswa) => {
    setEditItem(s);
    setForm({ nis: s.nis ?? '', nama: s.nama, email: s.email ?? '', telepon: s.telepon ?? '', jenis_kelamin: s.jenis_kelamin ?? '', username: '', password: '' });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi';
    if (!form.nis.trim()) e.nis = 'NIS wajib diisi';
    if (!editItem && !form.username.trim()) e.username = 'Username wajib diisi';
    if (!editItem && !form.password.trim()) e.password = 'Password wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    if (editItem) {
      const { error } = await supabase.from('siswa').update({
        nis: form.nis,
        nama: form.nama,
        email: form.email || null,
        telepon: form.telepon || null,
        jenis_kelamin: form.jenis_kelamin || null,
      }).eq('id', editItem.id);
      if (error) { notify('error', 'Gagal memperbarui data siswa'); setSaving(false); return; }
      notify('success', 'Data siswa berhasil diperbarui');
    } else {
      const { data: existing } = await supabase.from('users').select('id').eq('username', form.username).maybeSingle();
      if (existing) { setErrors(e => ({ ...e, username: 'Username sudah digunakan' })); setSaving(false); return; }

      const { data: newUser, error: userErr } = await supabase.from('users').insert({
        username: form.username,
        password_hash: form.password,
        nama: form.nama,
        role: 'siswa',
      }).select().single();

      if (userErr) { notify('error', 'Gagal membuat akun siswa'); setSaving(false); return; }

      const { error } = await supabase.from('siswa').insert({
        user_id: newUser.id,
        nis: form.nis,
        nama: form.nama,
        email: form.email || null,
        telepon: form.telepon || null,
        jenis_kelamin: form.jenis_kelamin || null,
      });

      if (error) {
        await supabase.from('users').delete().eq('id', newUser.id);
        notify('error', 'Gagal menambahkan data siswa');
        setSaving(false);
        return;
      }
      notify('success', 'Data siswa berhasil ditambahkan');
    }

    setSaving(false);
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('siswa').delete().eq('id', deleteId);
    if (error) notify('error', 'Gagal menghapus data siswa');
    else { notify('success', 'Data siswa berhasil dihapus'); load(); }
    setDeleting(false);
    setDeleteId(null);
  };

  const Field = ({ label, name, type = 'text', placeholder, isSelect = false }: { label: string; name: keyof FormData; type?: string; placeholder?: string; isSelect?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      {isSelect ? (
        <select
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className={errors[name] ? 'input-error' : 'input'}
        >
          <option value="">Pilih jenis kelamin</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
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
      title="Kelola Data Siswa"
      subtitle="Manajemen data siswa dan akun pelajar"
      action={
        <button onClick={openAdd} className="btn-primary px-4 py-2.5">
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </button>
      }
    >
      <div className="card animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">Daftar Siswa</p>
              <p className="text-xs text-surface-400">{filtered.length} data</p>
            </div>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, NIS, atau email..." />
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-surface-400">
              <span className="w-4 h-4 border-2 border-surface-300 border-t-success-500 rounded-full animate-spin" />
              Memuat data...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data siswa" description="Klik tombol Tambah Siswa untuk menambahkan data siswa" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">NIS</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Nama</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Jenis Kelamin</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Telepon</th>
                  <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="group hover:bg-surface-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded">{s.nis ?? '-'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-surface-900">{s.nama}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.jenis_kelamin ? (
                        <span className={`badge ${s.jenis_kelamin === 'L' ? 'bg-brand-50 text-brand-700' : 'bg-pink-50 text-pink-700'}`}>
                          {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.email ? (
                        <span className="flex items-center gap-1.5 text-surface-500">
                          <Mail className="w-3.5 h-3.5 text-surface-400" />
                          {s.email}
                        </span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.telepon ? (
                        <span className="flex items-center gap-1.5 text-surface-500">
                          <Phone className="w-3.5 h-3.5 text-surface-400" />
                          {s.telepon}
                        </span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(s)} className="btn-ghost p-2 rounded-lg" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-brand-600" />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="btn-ghost p-2 rounded-lg" title="Hapus">
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
      <Modal open={modalOpen} title={editItem ? 'Edit Data Siswa' : 'Tambah Siswa Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Informasi Pribadi</p>
            <Field label="NIS" name="nis" placeholder="Nomor Induk Siswa" />
            <Field label="Nama Lengkap" name="nama" placeholder="Nama lengkap siswa" />
            <Field label="Jenis Kelamin" name="jenis_kelamin" isSelect />
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
        title="Hapus Data Siswa"
        message="Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
