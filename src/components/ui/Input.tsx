import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-surface text-app-text placeholder:text-borders text-base px-3 py-2 rounded-[6px] outline-none transition-colors',
        invalid
          ? 'border-2 border-error'
          : 'border border-borders focus:border-2 focus:border-primary',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
export { Input };
