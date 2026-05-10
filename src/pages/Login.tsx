import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) return setError('Username tidak boleh kosong');
    if (!password.trim()) return setError('Password tidak boleh kosong');

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.error) { setError(result.error); return; }

    const stored = localStorage.getItem('school_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'guru') navigate('/guru');
      else navigate('/siswa');
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-brand-300/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Sistem Akademik</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Kelola Akademik<br />SMA/SMK Anda
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed">
              Platform terpadu untuk mengelola data guru, siswa, kelas, mata pelajaran, dan nilai akademik secara efisien.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { value: '3', label: 'Peran Pengguna' },
                { value: '100+', label: 'Fitur Tersedia' },
                { value: '24/7', label: 'Akses Sistem' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-brand-300 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-brand-400 text-sm">&copy; 2024 Sistem Akademik SMA/SMK</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <span className="text-surface-900 font-bold text-lg">Sistem Akademik</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900">Masuk ke Sistem</h2>
            <p className="text-surface-500 mt-2 text-sm">Masukkan kredensial Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700 flex items-center gap-2.5 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                <span className="text-danger-600 text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="input pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-200">
            <p className="text-xs text-surface-400 text-center font-semibold uppercase tracking-wider mb-3">Akun Demo</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', user: 'admin', pass: 'admin123', color: 'brand' },
                { label: 'Guru', user: 'guru1', pass: 'guru123', color: 'success' },
                { label: 'Siswa', user: 'siswa1', pass: 'siswa123', color: 'warning' },
              ].map(d => (
                <button
                  key={d.user}
                  type="button"
                  onClick={() => { setUsername(d.user); setPassword(d.pass); }}
                  className="py-2.5 px-3 rounded-xl border border-surface-200 text-surface-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all duration-150 text-xs font-semibold"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
