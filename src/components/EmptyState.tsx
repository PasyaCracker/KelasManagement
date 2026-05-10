import { Inbox as InboxIcon } from 'lucide-react';

interface Props {
  message?: string;
  description?: string;
}

export default function EmptyState({ message = 'Belum ada data', description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <InboxIcon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    </div>
  );
}
