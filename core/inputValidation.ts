import { AppError, ErrorCode } from "./errors";

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FieldValidation {
  field: string;
  errors: string[];
}

export function required(fieldName: string): ValidationRule<unknown> {
  return {
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    },
    message: `${fieldName} is required`,
  };
}

export function minLength(min: number, fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => typeof value === "string" && value.trim().length >= min,
    message: `${fieldName} must be at least ${min} characters`,
  };
}

export function maxLength(max: number, fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => typeof value === "string" && value.length <= max,
    message: `${fieldName} must be no more than ${max} characters`,
  };
}

export function pattern(regex: RegExp, message: string): ValidationRule<string> {
  return {
    validate: (value) => typeof value === "string" && regex.test(value),
    message,
  };
}

export function email(fieldName = "Email"): ValidationRule<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    validate: (value) => typeof value === "string" && emailRegex.test(value),
    message: `${fieldName} must be a valid email address`,
  };
}

export function url(fieldName = "URL"): ValidationRule<string> {
  return {
    validate: (value) => {
      if (typeof value !== "string") return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: `${fieldName} must be a valid URL`,
  };
}

export function numeric(fieldName: string): ValidationRule<unknown> {
  return {
    validate: (value) => typeof value === "number" && !isNaN(value),
    message: `${fieldName} must be a number`,
  };
}

export function range(min: number, max: number, fieldName: string): ValidationRule<number> {
  return {
    validate: (value) => typeof value === "number" && value >= min && value <= max,
    message: `${fieldName} must be between ${min} and ${max}`,
  };
}

export function positiveNumber(fieldName: string): ValidationRule<number> {
  return {
    validate: (value) => typeof value === "number" && value > 0,
    message: `${fieldName} must be a positive number`,
  };
}

export function arrayMinLength<T>(min: number, fieldName: string): ValidationRule<T[]> {
  return {
    validate: (value) => Array.isArray(value) && value.length >= min,
    message: `${fieldName} must have at least ${min} items`,
  };
}

export function oneOf<T>(allowed: T[], fieldName: string): ValidationRule<T> {
  return {
    validate: (value) => allowed.includes(value),
    message: `${fieldName} must be one of: ${allowed.join(", ")}`,
  };
}

export function noSpecialChars(fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => typeof value === "string" && /^[a-zA-Z0-9\s\-_]+$/.test(value),
    message: `${fieldName} contains invalid characters`,
  };
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

export function validateFields<T extends Record<string, unknown>>(
  data: T,
  fieldRules: Record<keyof T, ValidationRule<unknown>[]>
): FieldValidation[] {
  const validations: FieldValidation[] = [];
  
  for (const [field, rules] of Object.entries(fieldRules)) {
    const value = data[field as keyof T];
    const result = validate(value, rules as ValidationRule<unknown>[]);
    
    if (!result.valid) {
      validations.push({
        field,
        errors: result.errors,
      });
    }
  }
  
  return validations;
}

export function validateOrThrow<T>(value: T, rules: ValidationRule<T>[], errorCode?: ErrorCode): T {
  const result = validate(value, rules);
  
  if (!result.valid) {
    throw new AppError({
      code: errorCode || ErrorCode.VALIDATION_ERROR,
      message: result.errors.join("; "),
      context: { errors: result.errors },
    });
  }
  
  return value;
}

export function sanitizeString(value: unknown, defaultValue = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value).trim();
}

export function sanitizeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function sanitizeBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return defaultValue;
}

export function sanitizeArray<T>(value: unknown, itemValidator?: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  if (itemValidator) {
    return value.map(itemValidator);
  }
  return value as T[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
