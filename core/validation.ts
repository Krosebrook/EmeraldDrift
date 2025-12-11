import { AppError } from "./errors";

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValid<T>(value: T, rules: ValidationRule<T>[]): void {
  const result = validate(value, rules);
  if (!result.valid) {
    throw AppError.validation(result.errors.join(", "));
  }
}

export const rules = {
  required: <T>(fieldName: string): ValidationRule<T | null | undefined> => ({
    validate: (value) => value !== null && value !== undefined && value !== "",
    message: `${fieldName} is required`,
  }),

  minLength: (fieldName: string, min: number): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: `${fieldName} must be at least ${min} characters`,
  }),

  maxLength: (fieldName: string, max: number): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: `${fieldName} must be at most ${max} characters`,
  }),

  email: (fieldName: string): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: `${fieldName} must be a valid email address`,
  }),

  pattern: (fieldName: string, regex: RegExp, description: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message: `${fieldName} ${description}`,
  }),

  min: (fieldName: string, min: number): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: `${fieldName} must be at least ${min}`,
  }),

  max: (fieldName: string, max: number): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: `${fieldName} must be at most ${max}`,
  }),

  oneOf: <T>(fieldName: string, options: T[]): ValidationRule<T> => ({
    validate: (value) => options.includes(value),
    message: `${fieldName} must be one of: ${options.join(", ")}`,
  }),

  array: {
    minItems: <T>(fieldName: string, min: number): ValidationRule<T[]> => ({
      validate: (value) => value.length >= min,
      message: `${fieldName} must have at least ${min} item(s)`,
    }),

    maxItems: <T>(fieldName: string, max: number): ValidationRule<T[]> => ({
      validate: (value) => value.length <= max,
      message: `${fieldName} must have at most ${max} item(s)`,
    }),
  },
};

export function createValidator<T>() {
  const validators: Array<{ field: keyof T; rules: ValidationRule<unknown>[] }> = [];

  return {
    field<K extends keyof T>(field: K, fieldRules: ValidationRule<T[K]>[]) {
      validators.push({ field, rules: fieldRules as ValidationRule<unknown>[] });
      return this;
    },

    validate(value: T): ValidationResult {
      const errors: string[] = [];

      for (const { field, rules: fieldRules } of validators) {
        const fieldValue = value[field];
        const result = validate(fieldValue, fieldRules);
        errors.push(...result.errors);
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
  };
}
