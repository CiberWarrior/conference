'use client'

/**
 * Avatar component – initials or image (Telerik-style).
 * Used in Team table and Recent Registrations.
 */
interface AvatarProps {
  name?: string | null
  email?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return '?'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function Avatar({ name, email, src, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(name, email)

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white flex items-center justify-center font-semibold flex-shrink-0 ${sizeClasses[size]} ${className}`}
      title={name || email || undefined}
    >
      {initials}
    </div>
  )
}
