import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const icons = {
  success: <CheckCircle className="w-[18px] h-[18px]" />,
  error: <XCircle className="w-[18px] h-[18px]" />,
  warning: <AlertTriangle className="w-[18px] h-[18px]" />,
  info: <Info className="w-[18px] h-[18px]" />,
};

const styles = {
  success: 'bg-success-50 border-success-200 text-success-700',
  error: 'bg-danger-50 border-danger-200 text-danger-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  info: 'bg-brand-50 border-brand-200 text-brand-700',
};

const iconStyles = {
  success: 'text-success-500',
  error: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-brand-500',
};

export default function NotificationToast() {
  const { notifications, remove } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2.5 w-80">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-elevated animate-slide-in ${styles[n.type]}`}
        >
          <span className={`flex-shrink-0 mt-px ${iconStyles[n.type]}`}>{icons[n.type]}</span>
          <p className="flex-1 text-sm font-medium leading-snug">{n.message}</p>
          <button
            onClick={() => remove(n.id)}
            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-px"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
