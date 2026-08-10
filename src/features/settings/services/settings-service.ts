import 'server-only';

import { db } from '@/server/db';

export type UserSettingsData = {
  id: string;
  name: string;
  email: string;
  theme: string;
  timezone: string;
  locale: string;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
};

export function serializeSettings(
  user: { name: string; email: string },
  settings: {
    id: string;
    theme: string;
    timezone: string;
    locale: string;
    emailNotifications: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
): UserSettingsData {
  return {
    id: settings.id,
    name: user.name,
    email: user.email,
    theme: settings.theme,
    timezone: settings.timezone,
    locale: settings.locale,
    emailNotifications: settings.emailNotifications,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function getSettings(userId: string): Promise<UserSettingsData> {
  const [user, settings] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    db.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
  ]);

  return serializeSettings(user, settings);
}

export async function getLocale(userId: string): Promise<string> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { locale: true },
  });
  return settings?.locale ?? 'en';
}

export async function updateSettings(
  userId: string,
  input: {
    name: string;
    theme: string;
    timezone: string;
    locale: string;
    emailNotifications: boolean;
  }
): Promise<UserSettingsData> {
  const [, settings] = await Promise.all([
    db.user.update({ where: { id: userId }, data: { name: input.name } }),
    db.userSettings.upsert({
      where: { userId },
      update: {
        theme: input.theme,
        timezone: input.timezone,
        locale: input.locale,
        emailNotifications: input.emailNotifications,
      },
      create: {
        userId,
        theme: input.theme,
        timezone: input.timezone,
        locale: input.locale,
        emailNotifications: input.emailNotifications,
      },
    }),
  ]);

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return serializeSettings(user, settings);
}
