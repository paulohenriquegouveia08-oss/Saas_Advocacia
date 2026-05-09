'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
            'backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            error ? 'border-red-500' : 'border-zinc-700 hover:border-zinc-600',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
