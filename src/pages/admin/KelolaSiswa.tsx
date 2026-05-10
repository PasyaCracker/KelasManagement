import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

  const inp = (name: keyof FormData, label: string, type = 'text', placeholder?: string, isSelect = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {isSelect ? (
        <select
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
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
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <Layout title="Kelola Data Siswa" subtitle="Manajemen data siswa dan akun pelajar">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari siswa..." />
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Tambah Siswa
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data siswa" description="Klik tombol Tambah Siswa untuk menambahkan data siswa" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['No', 'NIS', 'Nama', 'Jenis Kelamin', 'Email', 'Telepon', 'Aksi'].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide ${h === 'Aksi' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.nis ?? '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nama}</td>
                    <td className="px-4 py-3">
                      {s.jenis_kelamin ? (
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${s.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.email ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.telepon ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title={editItem ? 'Edit Data Siswa' : 'Tambah Siswa Baru'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          {inp('nis', 'NIS', 'text', 'Nomor Induk Siswa')}
          {inp('nama', 'Nama Lengkap', 'text', 'Nama lengkap siswa')}
          {inp('jenis_kelamin', 'Jenis Kelamin', 'text', '', true)}
          {inp('email', 'Email', 'email', 'Email (opsional)')}
          {inp('telepon', 'Telepon', 'text', 'Nomor telepon (opsional)')}
          {!editItem && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Akun Login</p>
              <div className="space-y-3">
                {inp('username', 'Username', 'text', 'Username untuk login')}
                {inp('password', 'Password', 'password', 'Password untuk login')}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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
