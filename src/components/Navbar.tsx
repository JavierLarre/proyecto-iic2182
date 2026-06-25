'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Receipt, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/mapa',         label: 'Mapa',              icon: Map },
  { href: '/dashboard',    label: 'Órdenes de compra', icon: Receipt },
  { href: '/licitaciones', label: 'Licitaciones',      icon: FileSearch },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-b border-borders bg-surface flex items-center px-6 gap-1 flex-shrink-0">
      <Link href="/" className="font-brand font-bold text-app-text mr-6 text-h3 tracking-tight">
        Licitapp
      </Link>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            className={cn(
              'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] text-button font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-app-text/60 hover:bg-borders/40 hover:text-app-text',
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
