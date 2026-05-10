import { Inbox as InboxIcon } from 'lucide-react';

interface Props {
  message?: string;
  description?: string;
}

export default function EmptyState({ message = 'Belum ada data', description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <InboxIcon className="w-7 h-7 text-surface-400" />
      </div>
      <p className="text-surface-600 font-semibold text-sm">{message}</p>
      {description && <p className="text-surface-400 text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
