export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  // Minimum length
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres')
  }

  // Maximum length
  if (password.length > 128) {
    errors.push('Máximo 128 caracteres')
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una letra mayúscula')
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una letra minúscula')
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número')
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Al menos un carácter especial (!@#$%^&*...)')
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  const score = calculateStrengthScore(password)

  if (score >= 80) {
    strength = 'strong'
  } else if (score >= 50) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

function calculateStrengthScore(password: string): number {
  let score = 0

  // Length score
  score += Math.min(password.length * 4, 40)

  // Character variety
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/[0-9]/.test(password)) score += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15

  // Bonus for mixing
  const types = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ].filter(Boolean).length

  if (types >= 3) score += 10
  if (types === 4) score += 15

  return Math.min(score, 100)
}

// Common passwords to reject
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123',
  'admin', 'admin123', 'root', 'toor', 'pass', 'test'
]

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase())
}
