import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <NotificationToast />
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <div className="bg-white border-b border-gray-200 px-6 py-5 lg:px-8">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
