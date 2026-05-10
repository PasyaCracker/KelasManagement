import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const icons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const styles = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
};

const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export default function NotificationToast() {
  const { notifications, remove } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${styles[n.type]}`}
        >
          <span className={`flex-shrink-0 mt-0.5 ${iconStyles[n.type]}`}>{icons[n.type]}</span>
          <p className="flex-1 text-sm font-medium">{n.message}</p>
          <button
            onClick={() => remove(n.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
