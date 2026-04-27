/**
 * Password validation utilities
 * Provides functions to validate password strength and requirements
 */

/**
 * Password validation result interface
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: string[];
}

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  allowedSpecialChars: string;
}

/**
 * Default password requirements
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  allowedSpecialChars: '@$!%*?&'
};

/**
 * Validate password strength against requirements
 * @param password - Password to validate
 * @param requirements - Password requirements (uses defaults if not provided)
 * @returns Validation result with errors and requirements
 */
export const validatePassword = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult => {
  const errors: string[] = [];
  const requirementsText: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  requirementsText.push(`At least ${requirements.minLength} characters`);

  // Check for uppercase letters
  if (requirements.requireUppercase) {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }
    requirementsText.push('At least one uppercase letter (A-Z)');
  }

  // Check for lowercase letters
  if (requirements.requireLowercase) {
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }
    requirementsText.push('At least one lowercase letter (a-z)');
  }

  // Check for numbers
  if (requirements.requireNumbers) {
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number (0-9)');
    }
    requirementsText.push('At least one number (0-9)');
  }

  // Check for special characters
  if (requirements.requireSpecialChars) {
    const specialCharRegex = new RegExp(`[${requirements.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${requirements.allowedSpecialChars})`);
    }
    requirementsText.push(`At least one special character (${requirements.allowedSpecialChars})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements: requirementsText
  };
};

/**
 * Get formatted password requirements text
 * @param requirements - Password requirements (uses defaults if not provided)
 * @returns Formatted requirements string
 */
export const getPasswordRequirementsText = (
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string => {
  const validation = validatePassword('', requirements);
  return `Password must contain:\n${validation.requirements.map(req => `  - ${req}`).join('\n')}`;
};

/**
 * Check if password meets minimum requirements (quick validation)
 * @param password - Password to check
 * @param requirements - Password requirements (uses defaults if not provided)
 * @returns Boolean indicating if password meets requirements
 */
export const isPasswordStrong = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): boolean => {
  return validatePassword(password, requirements).isValid;
};

/**
 * Generate password strength score (0-100)
 * @param password - Password to score
 * @returns Strength score from 0 (very weak) to 100 (very strong)
 */
export const getPasswordStrengthScore = (password: string): number => {
  let score = 0;

  // Length contribution (up to 30 points)
  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 15;

  // Character variety contribution (up to 70 points)
  if (/[a-z]/.test(password)) score += 15; // lowercase
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/\d/.test(password)) score += 15;     // numbers
  if (/[^a-zA-Z\d]/.test(password)) score += 15; // special chars
  if (password.length >= 16) score += 10; // extra length bonus

  return Math.min(score, 100);
};

/**
 * Get password strength description
 * @param score - Password strength score
 * @returns Strength description
 */
export const getPasswordStrengthDescription = (score: number): string => {
  if (score < 30) return 'Very Weak';
  if (score < 50) return 'Weak';
  if (score < 70) return 'Fair';
  if (score < 85) return 'Good';
  return 'Strong';
};

/**
 * Comprehensive password analysis
 * @param password - Password to analyze
 * @param requirements - Password requirements (uses defaults if not provided)
 * @returns Complete password analysis
 */
export const analyzePassword = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
) => {
  const validation = validatePassword(password, requirements);
  const score = getPasswordStrengthScore(password);
  const strength = getPasswordStrengthDescription(score);

  return {
    password,
    isValid: validation.isValid,
    errors: validation.errors,
    requirements: validation.requirements,
    score,
    strength,
    meetsRequirements: validation.isValid,
    suggestions: getPasswordSuggestions(validation.errors)
  };
};

/**
 * Get password improvement suggestions based on errors
 * @param errors - Validation errors
 * @returns Array of improvement suggestions
 */
export const getPasswordSuggestions = (errors: string[]): string[] => {
  const suggestions: string[] = [];

  errors.forEach(error => {
    if (error.includes('characters long')) {
      suggestions.push('Try using a longer password with more characters');
    }
    if (error.includes('uppercase')) {
      suggestions.push('Add uppercase letters (A-Z) to your password');
    }
    if (error.includes('lowercase')) {
      suggestions.push('Add lowercase letters (a-z) to your password');
    }
    if (error.includes('number')) {
      suggestions.push('Include numbers (0-9) in your password');
    }
    if (error.includes('special character')) {
      suggestions.push('Add special characters like @, $, !, %, *, ?, &');
    }
  });

  if (suggestions.length === 0) {
    suggestions.push('Your password meets all requirements!');
  }

  return suggestions;
};
