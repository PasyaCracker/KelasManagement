import { useEffect, useState } from 'react';
import { Save, BookOpen, CheckCircle2, ChevronDown } from 'lucide-react';
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
  const dirtyCount = nilaiForms.filter(f => f.dirty).length;

  return (
    <Layout title="Kelola Nilai Siswa" subtitle="Input dan perbarui nilai siswa per kelas dan mata pelajaran">
      <div className="space-y-6 animate-fade-in">
        {/* Assignment selector */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <label className="text-sm font-semibold text-surface-900">Pilih Kelas & Mata Pelajaran</label>
          </div>
          <div className="relative max-w-md">
            <select
              value={selectedAssignment}
              onChange={e => handleAssignChange(e.target.value)}
              className="input appearance-none pr-10 cursor-pointer"
            >
              <option value="">-- Pilih kelas dan mata pelajaran --</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.kelas?.nama_kelas} - {a.mapel?.nama_mapel}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
        </div>

        {selectedAssignment && (
          <div className="card overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div>
                <h3 className="font-semibold text-surface-900">
                  {selectedAsgn?.kelas?.nama_kelas} — {selectedAsgn?.mapel?.nama_mapel}
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">
                  Formula: Nilai Akhir = (40% x Tugas) + (30% x UTS) + (30% x UAS)
                </p>
              </div>
              {hasDirty && (
                <button
                  onClick={handleSaveAll}
                  className="btn-primary px-4 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Semua{dirtyCount > 1 ? ` (${dirtyCount})` : ''}
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-surface-500">Memuat data siswa...</p>
              </div>
            ) : nilaiForms.length === 0 ? (
              <EmptyState message="Belum ada siswa di kelas ini" description="Minta admin untuk menambahkan siswa ke kelas ini" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-12">No</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Siswa</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-32">Tugas (40%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-32">UTS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-32">UAS (30%)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-28">Nilai Akhir</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {nilaiForms.map((f, i) => {
                      const isSaving = saving[f.siswa_id];
                      return (
                        <tr
                          key={f.siswa_id}
                          className={`group transition-colors duration-150 ${
                            f.dirty
                              ? 'bg-warning-50/40'
                              : 'hover:bg-surface-50/80'
                          }`}
                        >
                          <td className="px-6 py-3.5 text-surface-400 font-medium tabular-nums">{i + 1}</td>
                          <td className="px-6 py-3.5">
                            <p className="font-medium text-surface-900">{f.siswa_nama}</p>
                            <p className="text-xs text-surface-400 mt-0.5">{f.siswa_nis || 'NIS tidak ada'}</p>
                          </td>
                          {(['nilai_tugas', 'nilai_uts', 'nilai_uas'] as const).map(field => (
                            <td key={field} className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={f[field]}
                                onChange={e => updateForm(i, field, e.target.value)}
                                className={`w-20 px-2.5 py-1.5 text-center text-sm rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                                  f[field] && !validateScore(f[field])
                                    ? 'input-error'
                                    : 'border border-surface-200 bg-white'
                                }`}
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3.5 text-center">
                            {f.nilai_akhir != null ? (
                              <span className={`font-bold text-base tabular-nums ${
                                f.nilai_akhir >= 75 ? 'text-success-600' : f.nilai_akhir >= 60 ? 'text-warning-600' : 'text-danger-600'
                              }`}>
                                {f.nilai_akhir.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-surface-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {f.dirty ? (
                              <button
                                onClick={() => handleSave(i)}
                                disabled={isSaving}
                                className="btn-primary px-3 py-1.5 text-xs"
                              >
                                {isSaving ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                Simpan
                              </button>
                            ) : f.nilai_id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Tersimpan
                              </span>
                            ) : (
                              <span className="text-xs text-surface-300">Belum diisi</span>
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
