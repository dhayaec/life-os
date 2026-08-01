import { z } from 'zod';

export const THEMES = ['light', 'dark', 'system'] as const;
export type ThemeLiteral = (typeof THEMES)[number];

export const LOCALES = ['en', 'es', 'fr', 'de', 'hi', 'pt', 'ja', 'zh'] as const;
export type LocaleLiteral = (typeof LOCALES)[number];

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;
export type TimezoneLiteral = (typeof TIMEZONES)[number];

export const updateSettingsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  theme: z.enum(THEMES),
  timezone: z.enum(TIMEZONES),
  locale: z.enum(LOCALES),
});
