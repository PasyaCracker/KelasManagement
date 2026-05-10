export type Role = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: Role;
}

export interface Guru {
  id: string;
  user_id: string | null;
  nip: string | null;
  nama: string;
  email: string | null;
  telepon: string | null;
  created_at: string;
}

export interface Siswa {
  id: string;
  user_id: string | null;
  nis: string | null;
  nama: string;
  email: string | null;
  telepon: string | null;
  jenis_kelamin: 'L' | 'P' | null;
  created_at: string;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string | null;
  tahun_ajaran: string;
  created_at: string;
}

export interface Mapel {
  id: string;
  kode_mapel: string;
  nama_mapel: string;
  deskripsi: string | null;
  created_at: string;
}

export interface KelasSiswa {
  id: string;
  kelas_id: string;
  siswa_id: string;
  created_at: string;
  kelas?: Kelas;
  siswa?: Siswa;
}

export interface GuruMapelKelas {
  id: string;
  guru_id: string;
  mapel_id: string;
  kelas_id: string;
  created_at: string;
  guru?: Guru;
  mapel?: Mapel;
  kelas?: Kelas;
}

export interface Nilai {
  id: string;
  siswa_id: string;
  mapel_id: string;
  kelas_id: string;
  guru_id: string | null;
  nilai_tugas: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_akhir: number;
  created_at: string;
  updated_at: string;
  siswa?: Siswa;
  mapel?: Mapel;
  kelas?: Kelas;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}
