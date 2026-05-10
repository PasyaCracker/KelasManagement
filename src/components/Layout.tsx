import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Layout({ children, title, subtitle, action }: Props) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <NotificationToast />
      <div className="lg:pl-[260px]">
        <main className="min-h-screen">
          <header className="bg-white border-b border-surface-200/60 sticky top-0 z-20">
            <div className="px-5 lg:px-8 py-4 flex items-center justify-between">
              <div className="pl-12 lg:pl-0">
                <h1 className="text-lg font-bold text-surface-900">{title}</h1>
                {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          </header>
          <div className="p-5 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
