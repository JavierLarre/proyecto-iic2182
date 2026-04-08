'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, BarChart2, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/mapa', label: 'Mapa Territorial', icon: Map },
  { href: '/dashboard', label: 'Análisis Económico', icon: BarChart2 },
  { href: '/licitaciones', label: 'Licitaciones', icon: FileSearch },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-1 flex-shrink-0">
{links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
