import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Hapus', loading }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm animate-modal-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-danger-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900">{title}</h3>
              <p className="text-sm text-surface-500 mt-1.5 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 pb-6">
          <button onClick={onCancel} disabled={loading} className="btn-secondary px-4 py-2.5">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger px-4 py-2.5">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
