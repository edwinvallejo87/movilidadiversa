'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonModernProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gradient' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const ButtonModern = forwardRef<HTMLButtonElement, ButtonModernProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center
      font-semibold tracking-wide
      transition-all duration-300 ease-out
      rounded-xl overflow-hidden
      transform-gpu
      hover:scale-105 active:scale-95
      focus:outline-none focus:ring-4
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    `

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-purple-600 to-blue-600
        text-white shadow-lg shadow-purple-500/25
        hover:shadow-xl hover:shadow-purple-500/30
        focus:ring-purple-500/50
      `,
      secondary: `
        bg-white/80 backdrop-blur-sm
        text-gray-700 border-2 border-gray-200
        hover:bg-gray-50 hover:border-gray-300
        hover:shadow-lg focus:ring-gray-500/50
      `,
      gradient: `
        bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
        text-white shadow-lg shadow-purple-500/25
        hover:shadow-xl hover:shadow-purple-500/30
        focus:ring-purple-500/50
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-pink-600 before:via-purple-600 before:to-indigo-600
        before:opacity-0 hover:before:opacity-100
        before:transition-opacity before:duration-300
      `,
      ghost: `
        text-gray-700
        hover:bg-gray-100/80 hover:shadow-md
        focus:ring-gray-500/50
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-pink-500
        text-white shadow-lg shadow-red-500/25
        hover:shadow-xl hover:shadow-red-500/30
        focus:ring-red-500/50
      `
    }

    return (
      <button
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="relative z-10">
          {children}
        </span>
      </button>
    )
  }
)

ButtonModern.displayName = 'ButtonModern'

export { ButtonModern }