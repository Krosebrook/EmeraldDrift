import { validate, rules, type ValidationResult } from "./validation";
import type { CreateContentInput, UpdateContentInput } from "@/features/content";
import type { PlatformType } from "@/features/shared/types";

const VALID_PLATFORMS: PlatformType[] = ["instagram", "tiktok", "youtube", "linkedin", "pinterest"];
const MAX_TITLE_LENGTH = 100;
const MAX_CAPTION_LENGTH = 2200;
const MIN_TITLE_LENGTH = 1;

export interface ContentValidationErrors {
  title?: string;
  caption?: string;
  platforms?: string;
  scheduledAt?: string;
  mediaUri?: string;
}

export function validateContentCreate(input: Partial<CreateContentInput>): ValidationResult & { fieldErrors: ContentValidationErrors } {
  const errors: string[] = [];
  const fieldErrors: ContentValidationErrors = {};

  if (!input.title || input.title.trim().length === 0) {
    const msg = "Title is required";
    errors.push(msg);
    fieldErrors.title = msg;
  } else if (input.title.length < MIN_TITLE_LENGTH) {
    const msg = `Title must be at least ${MIN_TITLE_LENGTH} character`;
    errors.push(msg);
    fieldErrors.title = msg;
  } else if (input.title.length > MAX_TITLE_LENGTH) {
    const msg = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    errors.push(msg);
    fieldErrors.title = msg;
  }

  if (input.caption && input.caption.length > MAX_CAPTION_LENGTH) {
    const msg = `Caption must be ${MAX_CAPTION_LENGTH} characters or less`;
    errors.push(msg);
    fieldErrors.caption = msg;
  }

  if (!input.platforms || input.platforms.length === 0) {
    const msg = "Select at least one platform";
    errors.push(msg);
    fieldErrors.platforms = msg;
  } else {
    const invalidPlatforms = input.platforms.filter((p) => !VALID_PLATFORMS.includes(p));
    if (invalidPlatforms.length > 0) {
      const msg = `Invalid platform(s): ${invalidPlatforms.join(", ")}`;
      errors.push(msg);
      fieldErrors.platforms = msg;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

export function validateContentUpdate(input: Partial<UpdateContentInput>): ValidationResult & { fieldErrors: ContentValidationErrors } {
  const errors: string[] = [];
  const fieldErrors: ContentValidationErrors = {};

  if (input.title !== undefined) {
    if (input.title.trim().length === 0) {
      const msg = "Title cannot be empty";
      errors.push(msg);
      fieldErrors.title = msg;
    } else if (input.title.length > MAX_TITLE_LENGTH) {
      const msg = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
      errors.push(msg);
      fieldErrors.title = msg;
    }
  }

  if (input.caption !== undefined && input.caption.length > MAX_CAPTION_LENGTH) {
    const msg = `Caption must be ${MAX_CAPTION_LENGTH} characters or less`;
    errors.push(msg);
    fieldErrors.caption = msg;
  }

  if (input.platforms !== undefined) {
    if (input.platforms.length === 0) {
      const msg = "Select at least one platform";
      errors.push(msg);
      fieldErrors.platforms = msg;
    } else {
      const invalidPlatforms = input.platforms.filter((p) => !VALID_PLATFORMS.includes(p));
      if (invalidPlatforms.length > 0) {
        const msg = `Invalid platform(s): ${invalidPlatforms.join(", ")}`;
        errors.push(msg);
        fieldErrors.platforms = msg;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

export function validateScheduleDate(scheduledAt: string | undefined): ValidationResult & { fieldErrors: ContentValidationErrors } {
  const errors: string[] = [];
  const fieldErrors: ContentValidationErrors = {};

  if (!scheduledAt) {
    const msg = "Schedule date is required";
    errors.push(msg);
    fieldErrors.scheduledAt = msg;
    return { valid: false, errors, fieldErrors };
  }

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime())) {
    const msg = "Invalid date format";
    errors.push(msg);
    fieldErrors.scheduledAt = msg;
    return { valid: false, errors, fieldErrors };
  }

  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  if (date < fiveMinutesFromNow) {
    const msg = "Schedule time must be at least 5 minutes in the future";
    errors.push(msg);
    fieldErrors.scheduledAt = msg;
  }

  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (date > oneYearFromNow) {
    const msg = "Schedule time cannot be more than 1 year in the future";
    errors.push(msg);
    fieldErrors.scheduledAt = msg;
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

export function validateMediaUri(uri: string | undefined): ValidationResult & { fieldErrors: ContentValidationErrors } {
  const errors: string[] = [];
  const fieldErrors: ContentValidationErrors = {};

  if (uri) {
    const validPrefixes = ["file://", "content://", "ph://", "assets-library://", "http://", "https://"];
    const isValid = validPrefixes.some((prefix) => uri.startsWith(prefix));
    
    if (!isValid) {
      const msg = "Invalid media file format";
      errors.push(msg);
      fieldErrors.mediaUri = msg;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

export function getCharacterCount(text: string, maxLength: number): { count: number; remaining: number; isOverLimit: boolean } {
  const count = text.length;
  return {
    count,
    remaining: maxLength - count,
    isOverLimit: count > maxLength,
  };
}

export const LIMITS = {
  TITLE_MAX: MAX_TITLE_LENGTH,
  CAPTION_MAX: MAX_CAPTION_LENGTH,
  TITLE_MIN: MIN_TITLE_LENGTH,
} as const;
