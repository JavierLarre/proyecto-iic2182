import Link from 'next/link';
import { Map, Receipt, FileSearch } from 'lucide-react';

const FEATURES = [
  {
    href: '/mapa',
    icon: Map,
    title: 'Explora el territorio',
    desc: 'Descubre en qué comunas se concentran las órdenes de compra y las licitaciones.',
    cta: 'Abrir el mapa',
  },
  {
    href: '/dashboard',
    icon: Receipt,
    title: 'Analiza las órdenes de compra',
    desc: '¿Quién vende al Estado y cuánto? Montos, proveedores y concentración de las compras concretadas.',
    cta: 'Ver órdenes de compra',
  },
  {
    href: '/licitaciones',
    icon: FileSearch,
    title: 'Encuentra oportunidades',
    desc: 'Busca licitaciones abiertas por rubro y evalúa si tu cliente debería ofertar.',
    cta: 'Buscar licitaciones',
  },
];

const OUTER = 838;
const CIRCLES = [
  { size: 838, src: '/circle-outer.svg', delay: '0s' },
  { size: 630, src: '/circle-mid.svg',   delay: '0.35s' },
  { size: 420, src: '/circle-inner.svg', delay: '0.7s' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">

      {/* Pulse — cúpula concéntrica que nace desde el borde inferior de la página */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-0 opacity-90"
        style={{ width: 'min(940px, 92vw)', aspectRatio: '1' }}
        aria-hidden="true"
      >
        {CIRCLES.map(({ size, src, delay }) => {
          const pct    = (size / OUTER) * 100;
          const offset = (100 - pct) / 2;
          return (
            <div
              key={size}
              className="absolute"
              style={{
                width:          `${pct}%`,
                height:         `${pct}%`,
                top:            `${offset}%`,
                left:           `${offset}%`,
                animation:      'pulse-ring 3.2s ease-in-out infinite',
                animationDelay: delay,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full" />
            </div>
          );
        })}
      </div>

      {/* Hero navbar */}
      <header className="h-16 sm:h-20 px-4 sm:px-16 flex items-center justify-between gap-3 flex-shrink-0 relative z-10">
        <span className="font-brand font-bold text-h3 sm:text-h1 text-app-text tracking-tight">
          Licitapp
        </span>
        <nav className="hidden sm:flex items-center gap-4 sm:gap-10">
          {[
            { href: '/mapa',         label: 'Mapa' },
            { href: '/dashboard',    label: 'Órdenes de compra' },
            { href: '/licitaciones', label: 'Licitaciones' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm sm:text-button text-app-text/70 hover:text-app-text transition-colors whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Hero region */}
      <section className="relative z-10">
        {/* Hero content */}
        <div className="flex flex-col items-center text-center px-6 pt-20 pb-14 gap-6">
          <h1 className="text-h1 font-bold leading-tight max-w-3xl text-balance">
            <span className="text-primary">Inteligencia territorial</span>
            {' '}
            <span className="text-app-text">para el mercado público chileno</span>
          </h1>

          <p className="text-body text-app-text/80 max-w-[600px] leading-snug text-balance">
            Encuentra licitaciones y órdenes de compra, analiza la competencia
            y decide dónde le conviene ofertar a tu cliente.
          </p>
        </div>
      </section>

      {/* Feature cards — dan dirección: qué hace cada vista y para qué */}
      <section className="relative z-10 px-6 pb-20 pt-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ href, icon: Icon, title, desc, cta }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 bg-surface border border-borders rounded-[12px] p-6
                         hover:border-primary/50 hover:shadow-md transition-all
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h2 className="text-h3 font-semibold text-app-text">{title}</h2>
              <p className="text-sm text-app-text/60 leading-relaxed flex-1">{desc}</p>
              <span className="text-sm font-medium text-primary group-hover:underline">{cta} →</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
