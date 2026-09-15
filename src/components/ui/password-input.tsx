'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Input } from './input';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className="group relative">
        <Input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={cn(
            'pr-12 transition-[border-color,box-shadow] duration-300',
            'group-focus-within:border-primary/60 group-focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.14)]',
            isVisible && 'border-primary/50 shadow-[0_0_18px_hsl(var(--primary)/0.16)]',
            className
          )}
          {...props}
        />

        <button
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className={cn(
            'absolute inset-y-1.5 right-1.5 flex w-9 items-center justify-center rounded-full',
            'border border-transparent text-muted-foreground transition-all duration-300',
            'hover:border-primary/20 hover:bg-primary/10 hover:text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
            isVisible && 'border-primary/25 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.22)]'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 rounded-full bg-primary/15 blur-sm transition-opacity duration-300',
              isVisible ? 'opacity-100' : 'opacity-0'
            )}
          />
          <span className="relative h-4 w-4">
            <Eye
              className={cn(
                'absolute inset-0 h-4 w-4 transition-all duration-300',
                isVisible ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-12 opacity-0'
              )}
            />
            <EyeOff
              className={cn(
                'absolute inset-0 h-4 w-4 transition-all duration-300',
                isVisible ? 'scale-75 rotate-12 opacity-0' : 'scale-100 rotate-0 opacity-100'
              )}
            />
          </span>
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
