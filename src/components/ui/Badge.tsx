import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'adjudicada' | 'desierta' | 'publicada' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  adjudicada: 'bg-success/15 text-success',
  desierta:   'bg-error/15 text-error',
  publicada:  'bg-primary/15 text-primary',
  default:    'bg-borders/40 text-app-text',
};

function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
