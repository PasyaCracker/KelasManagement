import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, ChevronDown, Filter } from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Nilai, Siswa, Mapel, Kelas } from '../../types';

interface NilaiRow extends Nilai {
  mapel: Mapel;
  kelas: Kelas;
}

function gradeColor(v: number) {
  if (v >= 90) return 'text-success-700 font-bold';
  if (v >= 75) return 'text-brand-700 font-semibold';
  if (v >= 60) return 'text-warning-700';
  return 'text-danger-600';
}

function gradeBadge(v: number) {
  if (v >= 90) return { label: 'A', cls: 'bg-success-50 text-success-700' };
  if (v >= 80) return { label: 'B+', cls: 'bg-brand-50 text-brand-700' };
  if (v >= 75) return { label: 'B', cls: 'bg-brand-50 text-brand-600' };
  if (v >= 65) return { label: 'C+', cls: 'bg-warning-50 text-warning-700' };
  if (v >= 60) return { label: 'C', cls: 'bg-warning-50 text-warning-600' };
  return { label: 'D', cls: 'bg-danger-50 text-danger-600' };
}

export default function LihatNilai() {
  const { user } = useAuth();
  const [, setSiswaProfile] = useState<Siswa | null>(null);
  const [rows, setRows] = useState<NilaiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [kelasList, setKelasList] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: profile } = await supabase.from('siswa').select('*').eq('user_id', user.id).maybeSingle();
      if (!profile) { setLoading(false); return; }
      setSiswaProfile(profile as Siswa);

      const { data } = await supabase
        .from('nilai')
        .select('*, mapel(*), kelas(*)')
        .eq('siswa_id', profile.id)
        .order('created_at');

      const nilaiRows = (data ?? []) as NilaiRow[];
      setRows(nilaiRows);

      const kelasMap = new Map<string, string>();
      nilaiRows.forEach(r => {
        if (r.kelas) kelasMap.set(r.kelas_id, r.kelas.nama_kelas);
      });
      setKelasList(Array.from(kelasMap.entries()).map(([id, nama]) => ({ id, nama })));
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = selectedKelas ? rows.filter(r => r.kelas_id === selectedKelas) : rows;
  const avg = filtered.length ? filtered.reduce((s, r) => s + (r.nilai_akhir ?? 0), 0) / filtered.length : 0;
  const lulus = filtered.filter(r => (r.nilai_akhir ?? 0) >= 75).length;
  const lulusRate = filtered.length ? Math.round((lulus / filtered.length) * 100) : 0;

  return (
    <Layout title="Nilai Saya" subtitle="Daftar nilai mata pelajaran Anda">
      {loading ? (
        <div className="space-y-3 animate-fade-in">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 h-20 animate-pulse">
              <div className="h-4 bg-surface-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada data nilai" description="Nilai Anda belum diinput oleh guru" />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Filters & summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <Filter className="w-4 h-4 text-surface-400" />
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Filter</span>
              </div>
              <div className="relative">
                <select
                  value={selectedKelas}
                  onChange={e => setSelectedKelas(e.target.value)}
                  className="input appearance-none pr-10 cursor-pointer w-56"
                >
                  <option value="">Semua Kelas</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <StatCard
                label="Rata-rata"
                value={avg.toFixed(1)}
                icon={<TrendingUp className="w-5 h-5" />}
                color="text-brand-600"
                bg="bg-brand-50"
              />
              <StatCard
                label="Ketuntasan"
                value={`${lulusRate}%`}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="text-success-600"
                bg="bg-success-50"
                trend={{ value: `${lulus}/${filtered.length} lulus`, up: lulusRate >= 75 }}
              />
            </div>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden space-y-3 animate-slide-up">
            {filtered.map(r => {
              const badge = r.nilai_akhir != null ? gradeBadge(r.nilai_akhir) : null;
              return (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-surface-900">{r.mapel?.nama_mapel}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{r.kelas?.nama_kelas}</p>
                    </div>
                    {badge && (
                      <span className={`badge text-sm ${badge.cls}`}>{badge.label}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Tugas', val: r.nilai_tugas },
                      { label: 'UTS', val: r.nilai_uts },
                      { label: 'UAS', val: r.nilai_uas },
                      { label: 'Akhir', val: r.nilai_akhir },
                    ].map(n => (
                      <div key={n.label} className="bg-surface-50 rounded-lg p-2.5 text-center">
                        <p className={`font-bold text-base tabular-nums ${n.val != null ? gradeColor(n.val) : 'text-surface-300'}`}>
                          {n.val?.toFixed(1) ?? '-'}
                        </p>
                        <p className="text-[10px] text-surface-400 uppercase tracking-wider mt-0.5">{n.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block card overflow-hidden animate-slide-up">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-12">No</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Mata Pelajaran</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Kelas</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Tugas (40%)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">UTS (30%)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">UAS (30%)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Nilai Akhir</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Grade</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((r, i) => {
                  const badge = r.nilai_akhir != null ? gradeBadge(r.nilai_akhir) : null;
                  const lulus = (r.nilai_akhir ?? 0) >= 75;
                  return (
                    <tr key={r.id} className="hover:bg-surface-50/80 transition-colors duration-150">
                      <td className="px-6 py-3.5 text-surface-400 font-medium tabular-nums">{i + 1}</td>
                      <td className="px-6 py-3.5 font-medium text-surface-900">{r.mapel?.nama_mapel}</td>
                      <td className="px-4 py-3.5">
                        <span className="badge bg-surface-100 text-surface-600">{r.kelas?.nama_kelas}</span>
                      </td>
                      <td className={`px-4 py-3.5 text-center tabular-nums ${gradeColor(r.nilai_tugas)}`}>{r.nilai_tugas?.toFixed(1)}</td>
                      <td className={`px-4 py-3.5 text-center tabular-nums ${gradeColor(r.nilai_uts)}`}>{r.nilai_uts?.toFixed(1)}</td>
                      <td className={`px-4 py-3.5 text-center tabular-nums ${gradeColor(r.nilai_uas)}`}>{r.nilai_uas?.toFixed(1)}</td>
                      <td className={`px-4 py-3.5 text-center text-base tabular-nums ${r.nilai_akhir != null ? gradeColor(r.nilai_akhir) : 'text-surface-300'}`}>
                        {r.nilai_akhir?.toFixed(1) ?? '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`badge ${lulus ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-600'}`}>
                          {lulus ? 'Lulus' : 'Tidak Lulus'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
