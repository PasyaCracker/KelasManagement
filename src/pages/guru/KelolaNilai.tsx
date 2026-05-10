import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { Guru, Mapel, Kelas, Siswa, GuruMapelKelas } from '../../types';

interface Assignment extends GuruMapelKelas {
  mapel: Mapel;
  kelas: Kelas;
}

interface NilaiForm {
  siswa_id: string;
  siswa_nama: string;
  siswa_nis: string;
  nilai_id: string | null;
  nilai_tugas: string;
  nilai_uts: string;
  nilai_uas: string;
  nilai_akhir: number | null;
  dirty: boolean;
}

function calcAkhir(tugas: string, uts: string, uas: string): number | null {
  const t = parseFloat(tugas), u = parseFloat(uts), a = parseFloat(uas);
  if (isNaN(t) || isNaN(u) || isNaN(a)) return null;
  return Math.round((t * 0.4 + u * 0.3 + a * 0.3) * 100) / 100;
}

function validateScore(v: string): boolean {
  if (v === '') return true;
  const n = parseFloat(v);
  return !isNaN(n) && n >= 0 && n <= 100;
}

export default function KelolaNilai() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [guruProfile, setGuruProfile] = useState<Guru | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [nilaiForms, setNilaiForms] = useState<NilaiForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from('guru').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setGuruProfile(data as Guru);
      supabase
        .from('guru_mapel_kelas')
        .select('*, mapel(*), kelas(*)')
        .eq('guru_id', data.id)
        .then(({ data: asgn }) => setAssignments((asgn ?? []) as Assignment[]));
    });
  }, [user]);

  const loadNilai = async (assignId: string) => {
    const asgn = assignments.find(a => a.id === assignId);
    if (!asgn) return;
    setLoading(true);

    const [siswaEnrolled, existingNilai] = await Promise.all([
      supabase.from('kelas_siswa').select('siswa_id, siswa(*)').eq('kelas_id', asgn.kelas_id),
      supabase.from('nilai').select('*').eq('mapel_id', asgn.mapel_id).eq('kelas_id', asgn.kelas_id),
    ]);

    const nilaiMap = new Map((existingNilai.data ?? []).map(n => [n.siswa_id, n]));

    const forms: NilaiForm[] = (siswaEnrolled.data ?? []).map(e => {
      const s = e.siswa as unknown as Siswa;
      const n = nilaiMap.get(e.siswa_id);
      return {
        siswa_id: e.siswa_id,
        siswa_nama: s?.nama ?? '',
        siswa_nis: s?.nis ?? '',
        nilai_id: n?.id ?? null,
        nilai_tugas: n?.nilai_tugas?.toString() ?? '',
        nilai_uts: n?.nilai_uts?.toString() ?? '',
        nilai_uas: n?.nilai_uas?.toString() ?? '',
        nilai_akhir: n?.nilai_akhir ?? null,
        dirty: false,
      };
    });

    setNilaiForms(forms);
    setLoading(false);
  };

  const handleAssignChange = (id: string) => {
    setSelectedAssignment(id);
    setNilaiForms([]);
    if (id) loadNilai(id);
  };

  const updateForm = (idx: number, field: 'nilai_tugas' | 'nilai_uts' | 'nilai_uas', value: string) => {
    setNilaiForms(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, [field]: value, dirty: true };
      const ak = calcAkhir(
        field === 'nilai_tugas' ? value : f.nilai_tugas,
        field === 'nilai_uts' ? value : f.nilai_uts,
        field === 'nilai_uas' ? value : f.nilai_uas,
      );
      return { ...updated, nilai_akhir: ak };
    }));
  };

  const handleSave = async (idx: number) => {
    const f = nilaiForms[idx];
    const asgn = assignments.find(a => a.id === selectedAssignment);
    if (!asgn || !guruProfile) return;

    if (!validateScore(f.nilai_tugas) || !validateScore(f.nilai_uts) || !validateScore(f.nilai_uas)) {
      notify('error', 'Nilai harus berupa angka 0-100');
      return;
    }

    setSaving(s => ({ ...s, [f.siswa_id]: true }));

    const payload = {
      siswa_id: f.siswa_id,
      mapel_id: asgn.mapel_id,
      kelas_id: asgn.kelas_id,
      guru_id: guruProfile.id,
      nilai_tugas: f.nilai_tugas === '' ? 0 : parseFloat(f.nilai_tugas),
      nilai_uts: f.nilai_uts === '' ? 0 : parseFloat(f.nilai_uts),
      nilai_uas: f.nilai_uas === '' ? 0 : parseFloat(f.nilai_uas),
    };

    const { error } = f.nilai_id
      ? await supabase.from('nilai').update(payload).eq('id', f.nilai_id)
      : await supabase.from('nilai').insert(payload);

    if (error) notify('error', `Gagal menyimpan nilai: ${error.message}`);
    else {
      notify('success', `Nilai ${f.siswa_nama} berhasil disimpan`);
      setNilaiForms(prev => prev.map((p, i) => i === idx ? { ...p, dirty: false } : p));
      loadNilai(selectedAssignment);
    }

    setSaving(s => ({ ...s, [f.siswa_id]: false }));
  };

  const handleSaveAll = async () => {
    const dirty = nilaiForms.map((f, i) => ({ ...f, idx: i })).filter(f => f.dirty);
    if (dirty.length === 0) { notify('info', 'Tidak ada perubahan untuk disimpan'); return; }
    for (const f of dirty) await handleSave(f.idx);
  };

  const selectedAsgn = assignments.find(a => a.id === selectedAssignment);
  const hasDirty = nilaiForms.some(f => f.dirty);

  return (
    <Layout title="Kelola Nilai Siswa" subtitle="Input dan perbarui nilai siswa per kelas dan mata pelajaran">
      <div className="space-y-5">
        {/* Select assignment */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Kelas & Mata Pelajaran</label>
          <select
            value={selectedAssignment}
            onChange={e => handleAssignChange(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih kelas dan mata pelajaran --</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>{a.kelas?.nama_kelas} - {a.mapel?.nama_mapel}</option>
            ))}
          </select>
        </div>

        {selectedAssignment && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedAsgn?.kelas?.nama_kelas} — {selectedAsgn?.mapel?.nama_mapel}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Formula: Nilai Akhir = (40% × Tugas) + (30% × UTS) + (30% × UAS)</p>
              </div>
              {hasDirty && (
                <button
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Simpan Semua
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Memuat data siswa...</div>
            ) : nilaiForms.length === 0 ? (
              <EmptyState message="Belum ada siswa di kelas ini" description="Minta admin untuk menambahkan siswa ke kelas ini" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-8">No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Siswa</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-28">Tugas (40%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-28">UTS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-28">UAS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-24">Nilai Akhir</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {nilaiForms.map((f, i) => {
                      const isSaving = saving[f.siswa_id];
                      return (
                        <tr key={f.siswa_id} className={`hover:bg-gray-50/50 transition-colors ${f.dirty ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{f.siswa_nama}</p>
                            <p className="text-xs text-gray-400">{f.siswa_nis || 'NIS tidak ada'}</p>
                          </td>
                          {(['nilai_tugas', 'nilai_uts', 'nilai_uas'] as const).map(field => (
                            <td key={field} className="px-4 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={f[field]}
                                onChange={e => updateForm(i, field, e.target.value)}
                                className={`w-20 px-2 py-1.5 text-center border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  f[field] && !validateScore(f[field]) ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            {f.nilai_akhir != null ? (
                              <span className={`font-bold text-base ${
                                f.nilai_akhir >= 75 ? 'text-emerald-600' : f.nilai_akhir >= 60 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {f.nilai_akhir.toFixed(1)}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {f.dirty ? (
                              <button
                                onClick={() => handleSave(i)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                              >
                                {isSaving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                                Simpan
                              </button>
                            ) : f.nilai_id ? (
                              <span className="text-xs text-gray-400 flex items-center gap-1 justify-center">
                                <RotateCcw className="w-3 h-3" /> Tersimpan
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">Belum diisi</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!selectedAssignment && (
          <EmptyState message="Pilih kelas dan mata pelajaran" description="Gunakan dropdown di atas untuk memilih kelas yang ingin dikelola nilainya" />
        )}
      </div>
    </Layout>
  );
}
