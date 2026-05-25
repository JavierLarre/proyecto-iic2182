import Link from 'next/link';

const OUTER = 838;
const CIRCLES = [
  { size: 838, src: '/circle-outer.svg', delay: '0s' },
  { size: 630, src: '/circle-mid.svg',   delay: '0.35s' },
  { size: 420, src: '/circle-inner.svg', delay: '0.7s' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">

      {/* Hero navbar */}
      <header className="h-20 px-16 flex items-center justify-between flex-shrink-0 relative z-10">
        <span className="font-brand font-bold text-h1 text-app-text tracking-tight">
          Licitapp
        </span>
        <nav className="flex items-center gap-10">
          {[
            { href: '/mapa',         label: 'Mapa' },
            { href: '/dashboard',    label: 'Dashboard' },
            { href: '/licitaciones', label: 'Licitaciones' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-button text-app-text/70 hover:text-app-text transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Hero content */}
      <div className="flex flex-col items-center text-center px-6 pt-12 gap-6 flex-shrink-0 relative z-10">
        <h1 className="text-h1 font-bold leading-tight max-w-3xl">
          <span className="text-primary">Inteligencia territorial</span>
          {' '}
          <span className="text-app-text">para el mercado público chileno</span>
        </h1>

        <p className="text-body text-app-text max-w-[600px] leading-snug">
          Visualiza proveedores, analiza licitaciones y anticipa oportunidades
          en cualquier territorio de Chile
        </p>

        <Link
          href="/mapa"
          className="bg-primary hover:bg-primary-hover text-surface text-cta font-semibold
                     px-6 py-2 rounded-[12px] transition-colors w-[220px] text-center"
        >
          Ir al mapa
        </Link>
      </div>

      {/* Pulsating circles — percentage-based so they scale with viewport */}
      <div className="flex-1 relative" aria-hidden="true">
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2"
          style={{ width: 'min(838px, 90vw)', aspectRatio: '1' }}
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
      </div>

    </div>
  );
}
