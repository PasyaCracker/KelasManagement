import { useEffect, useState } from 'react';
import { Trash2, Plus, UserCog, Search } from 'lucide-react';
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

  const sel = (key: keyof typeof form, opts: { id: string; label: string; sub?: string }[], placeholder: string, _icon?: React.ReactNode) => (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">{placeholder.replace('Pilih ', '').replace('...', '')}</label>
      <select
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className={form[key] ? 'input font-medium' : 'input'}
      >
        <option value="">{placeholder}</option>
        {opts.map(o => (
          <option key={o.id} value={o.id}>
            {o.label}{o.sub ? ` (${o.sub})` : ''}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Layout title="Tetapkan Guru Pengajar" subtitle="Kelola penugasan guru untuk setiap mata pelajaran dan kelas">
      <div className="space-y-5 animate-fade-in">
        {/* Form Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
              <UserCog className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">Tambah Penetapan Guru</p>
              <p className="text-xs text-surface-400">Pilih guru, mata pelajaran, dan kelas</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sel('guru_id', guruList.map(g => ({ id: g.id, label: g.nama, sub: g.nip ?? undefined })), 'Pilih Guru...', <UserCog className="w-4 h-4" />)}
            {sel('mapel_id', mapelList.map(m => ({ id: m.id, label: m.nama_mapel, sub: m.kode_mapel })), 'Pilih Mapel...', <UserCog className="w-4 h-4" />)}
            {sel('kelas_id', kelasList.map(k => ({ id: k.id, label: k.nama_kelas, sub: k.tahun_ajaran })), 'Pilih Kelas...', <UserCog className="w-4 h-4" />)}
            <div className="flex items-end">
              <button
                onClick={handleAdd}
                disabled={saving || !validate()}
                className="btn-primary w-full py-2.5"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Tetapkan
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-surface-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center">
                <UserCog className="w-3.5 h-3.5 text-surface-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">Daftar Penetapan Guru</p>
                <p className="text-xs text-surface-400">{filtered.length} penetapan</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari guru, mapel, atau kelas..."
                className="input pl-9 w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-surface-400">
                <span className="w-4 h-4 border-2 border-surface-300 border-t-brand-600 rounded-full animate-spin" />
                Memuat data...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="Belum ada penetapan guru" description="Gunakan form di atas untuk menetapkan guru pengajar" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">No</th>
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Guru</th>
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Mata Pelajaran</th>
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Kelas</th>
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Tahun Ajaran</th>
                    <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {filtered.map((a, i) => (
                    <tr key={a.id} className="group hover:bg-surface-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-surface-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-surface-900">{a.guru?.nama}</p>
                      </td>
                      <td className="px-5 py-3.5 text-surface-600">{a.mapel?.nama_mapel}</td>
                      <td className="px-5 py-3.5">
                        <span className="badge bg-success-50 text-success-700">
                          {a.kelas?.nama_kelas}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-surface-500">{a.kelas?.tahun_ajaran}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDeleteId(a.id)} className="btn-ghost p-2 rounded-lg" title="Hapus">
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
