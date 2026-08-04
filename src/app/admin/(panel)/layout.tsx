import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminLayout } from '@/admin/AdminLayout';

// Админка не должна попадать в индекс в принципе. /admin/login живёт вне этой
// группы и закрывается своим noindex.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
