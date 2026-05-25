import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'cta' | 'default' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:bg-borders disabled:text-app-text/40 cursor-pointer';

const variants: Record<Variant, string> = {
  cta:       'bg-primary hover:bg-primary-hover text-white text-cta px-8 py-3 rounded-[12px]',
  default:   'bg-primary hover:bg-primary-hover text-white text-button px-4 py-2 rounded-[6px]',
  secondary: 'bg-surface hover:bg-borders text-app-text text-button border border-borders px-4 py-2 rounded-[6px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
export { Button };
