import { ReactNode } from 'react'

interface CardModernProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export function CardModern({ 
  children, 
  className = '', 
  hover = true,
  gradient = false 
}: CardModernProps) {
  return (
    <div 
      className={`
        relative overflow-hidden
        bg-white/80 backdrop-blur-xl
        border border-gray-200/50
        rounded-2xl
        shadow-xl shadow-gray-200/20
        ${hover ? 'transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-200/30' : ''}
        ${gradient ? 'bg-gradient-to-br from-white via-purple-50/10 to-blue-50/10' : ''}
        ${className}
      `}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export function CardHeader({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={`p-6 pb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <h3 className={`text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <p className={`mt-2 text-gray-600 ${className}`}>
      {children}
    </p>
  )
}